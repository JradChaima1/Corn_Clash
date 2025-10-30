import { redis } from '@devvit/web/server';

// Redis key constants
const LEADERBOARD_DAILY = 'leaderboard:daily';
const LEADERBOARD_WEEKLY = 'leaderboard:weekly';
const LEADERBOARD_ALLTIME = 'leaderboard:alltime';
const LEADERBOARD_LAST_RESET = 'leaderboard:last_reset';

export interface LeaderboardEntry {
    username: string;
    score: number;
    rank: number;
}

export interface LeaderboardData {
    entries: LeaderboardEntry[];
    userRank: number | null;
    userScore: number | null;
    totalPlayers: number;
}

export class LeaderboardManager {
    private static instance: LeaderboardManager;

    private constructor() { }

    static getInstance(): LeaderboardManager {
        if (!LeaderboardManager.instance) {
            LeaderboardManager.instance = new LeaderboardManager();
        }
        return LeaderboardManager.instance;
    }

    /**
     * Record a score to all leaderboards (only if it's higher than existing score)
     */
    async recordScore(username: string, score: number): Promise<void> {
        console.log(`[Leaderboard] Recording score ${score} for ${username}`);

        try {
            // Check if we need to reset daily/weekly leaderboards
            await this.checkAndResetLeaderboards();

            // Get existing scores
            const [dailyScore, weeklyScore, alltimeScore] = await Promise.all([
                redis.zScore(LEADERBOARD_DAILY, username),
                redis.zScore(LEADERBOARD_WEEKLY, username),
                redis.zScore(LEADERBOARD_ALLTIME, username),
            ]);

            // Only update if new score is higher than existing score
            const updates: Promise<number>[] = [];

            if (dailyScore === null || dailyScore === undefined || score > dailyScore) {
                console.log(`[Leaderboard] Updating daily: ${dailyScore ?? 'none'} -> ${score}`);
                updates.push(redis.zAdd(LEADERBOARD_DAILY, { member: username, score }));
            }

            if (weeklyScore === null || weeklyScore === undefined || score > weeklyScore) {
                console.log(`[Leaderboard] Updating weekly: ${weeklyScore ?? 'none'} -> ${score}`);
                updates.push(redis.zAdd(LEADERBOARD_WEEKLY, { member: username, score }));
            }

            if (alltimeScore === null || alltimeScore === undefined || score > alltimeScore) {
                console.log(`[Leaderboard] Updating alltime: ${alltimeScore ?? 'none'} -> ${score}`);
                updates.push(redis.zAdd(LEADERBOARD_ALLTIME, { member: username, score }));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                console.log(`[Leaderboard] Score recorded successfully (${updates.length} leaderboards updated)`);
            } else {
                console.log(`[Leaderboard] Score ${score} not recorded - not higher than existing scores`);
            }
        } catch (error) {
            console.error('[Leaderboard] Error recording score:', error);
        }
    }

    /**
     * Get leaderboard data for a specific period
     */
    async getLeaderboard(
        period: 'daily' | 'weekly' | 'alltime',
        username?: string,
        limit: number = 100
    ): Promise<LeaderboardData> {
        const leaderboardKey = this.getLeaderboardKey(period);

        try {
            // Get top players (descending order - highest scores first)
            const topPlayers = await redis.zRange(leaderboardKey, 0, limit - 1, {
                by: 'rank',
                reverse: true,
            });

            // Get total player count
            const totalPlayers = await redis.zCard(leaderboardKey);

            // Format entries with ranks
            const entries: LeaderboardEntry[] = topPlayers.map((entry, index) => ({
                username: entry.member,
                score: entry.score,
                rank: index + 1,
            }));

            // Get user's rank and score if username provided
            let userRank: number | null = null;
            let userScore: number | null = null;

            if (username) {
                const userScoreResult = await redis.zScore(leaderboardKey, username);
                if (userScoreResult !== null && userScoreResult !== undefined) {
                    userScore = userScoreResult;
                    // Get rank in ascending order (lowest score = rank 0)
                    const ascendingRank = await redis.zRank(leaderboardKey, username);
                    // Convert to descending order: rank = totalPlayers - ascendingRank
                    if (ascendingRank !== null && ascendingRank !== undefined) {
                        userRank = totalPlayers - ascendingRank;
                    }
                }
            }

            return {
                entries,
                userRank,
                userScore,
                totalPlayers,
            };
        } catch (error) {
            console.error(`[Leaderboard] Error getting ${period} leaderboard:`, error);
            return {
                entries: [],
                userRank: null,
                userScore: null,
                totalPlayers: 0,
            };
        }
    }

    /**
     * Get user's rank across all leaderboards
     */
    async getUserRanks(username: string): Promise<{
        daily: number | null;
        weekly: number | null;
        alltime: number | null;
    }> {
        try {
            const [dailyRank, weeklyRank, alltimeRank] = await Promise.all([
                this.getUserRank(LEADERBOARD_DAILY, username),
                this.getUserRank(LEADERBOARD_WEEKLY, username),
                this.getUserRank(LEADERBOARD_ALLTIME, username),
            ]);

            return {
                daily: dailyRank,
                weekly: weeklyRank,
                alltime: alltimeRank,
            };
        } catch (error) {
            console.error('[Leaderboard] Error getting user ranks:', error);
            return {
                daily: null,
                weekly: null,
                alltime: null,
            };
        }
    }

    /**
     * Check if leaderboards need to be reset (daily/weekly)
     */
    private async checkAndResetLeaderboards(): Promise<void> {
        try {
            const lastResetStr = await redis.get(LEADERBOARD_LAST_RESET);
            const lastReset = lastResetStr ? parseInt(lastResetStr) : 0;
            const now = Date.now();

            // Check if we need to reset daily (24 hours)
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (now - lastReset > oneDayMs) {
                console.log('[Leaderboard] Resetting daily leaderboard');
                await redis.del(LEADERBOARD_DAILY);
            }

            // Check if we need to reset weekly (7 days)
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
            if (now - lastReset > oneWeekMs) {
                console.log('[Leaderboard] Resetting weekly leaderboard');
                await redis.del(LEADERBOARD_WEEKLY);
            }

            // Update last reset timestamp
            if (now - lastReset > oneDayMs) {
                await redis.set(LEADERBOARD_LAST_RESET, now.toString());
            }
        } catch (error) {
            console.error('[Leaderboard] Error checking/resetting leaderboards:', error);
        }
    }

    /**
     * Get user's rank in a specific leaderboard
     */
    private async getUserRank(leaderboardKey: string, username: string): Promise<number | null> {
        try {
            const rank = await redis.zRank(leaderboardKey, username);
            return rank !== null && rank !== undefined ? rank + 1 : null;
        } catch (error) {
            console.error(`[Leaderboard] Error getting user rank from ${leaderboardKey}:`, error);
            return null;
        }
    }

    /**
     * Get leaderboard key for a period
     */
    private getLeaderboardKey(period: 'daily' | 'weekly' | 'alltime'): string {
        switch (period) {
            case 'daily':
                return LEADERBOARD_DAILY;
            case 'weekly':
                return LEADERBOARD_WEEKLY;
            case 'alltime':
                return LEADERBOARD_ALLTIME;
        }
    }

    /**
     * Get community stats
     */
    async getCommunityStats(): Promise<{
        totalPlayers: number;
        totalScoresToday: number;
        highestScoreToday: number;
        topPlayerToday: string | null;
    }> {
        try {
            const totalPlayers = await redis.zCard(LEADERBOARD_ALLTIME);

            // Get top player today
            const topToday = await redis.zRange(LEADERBOARD_DAILY, 0, 0, {
                by: 'rank',
                reverse: true,
            });

            const topPlayerToday = topToday.length > 0 && topToday[0] ? topToday[0].member : null;
            const highestScoreToday = topToday.length > 0 && topToday[0] ? topToday[0].score : 0;

            // Get total scores today (sum of all scores)
            const allScoresToday = await redis.zRange(LEADERBOARD_DAILY, 0, -1, {
                by: 'rank',
            });
            const totalScoresToday = allScoresToday.reduce((sum, entry) => sum + entry.score, 0);

            return {
                totalPlayers,
                totalScoresToday,
                highestScoreToday,
                topPlayerToday,
            };
        } catch (error) {
            console.error('[Leaderboard] Error getting community stats:', error);
            return {
                totalPlayers: 0,
                totalScoresToday: 0,
                highestScoreToday: 0,
                topPlayerToday: null,
            };
        }
    }

    /**
     * Clear all leaderboard data (admin function)
     */
    async clearAllLeaderboards(): Promise<void> {
        console.log('[Leaderboard] Clearing all leaderboard data');
        try {
            await Promise.all([
                redis.del(LEADERBOARD_DAILY),
                redis.del(LEADERBOARD_WEEKLY),
                redis.del(LEADERBOARD_ALLTIME),
                redis.del(LEADERBOARD_LAST_RESET),
            ]);
            console.log('[Leaderboard] All leaderboards cleared successfully');
        } catch (error) {
            console.error('[Leaderboard] Error clearing leaderboards:', error);
            throw error;
        }
    }
}
