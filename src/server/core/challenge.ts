import { redis } from '@devvit/web/server';

// Redis key constants
const CHALLENGE_DAILY_MATCHES = 'challenge:daily:matches';
const CHALLENGE_DAILY_CONTRIBUTORS = 'challenge:daily:contributors';
const CHALLENGE_DAILY_RESET = 'challenge:daily:reset';
const CHALLENGE_GOAL = 2; // 2 matches to complete challenge (testing)

export interface ChallengeData {
    currentMatches: number;
    goalMatches: number;
    isCompleted: boolean;
    contributorCount: number;
    userContributed: boolean;
}

export class ChallengeManager {
    private static instance: ChallengeManager;

    private constructor() { }

    static getInstance(): ChallengeManager {
        if (!ChallengeManager.instance) {
            ChallengeManager.instance = new ChallengeManager();
        }
        return ChallengeManager.instance;
    }

    /**
     * Record a completed match (solo or multiplayer)
     */
    async recordMatchCompletion(username: string): Promise<void> {
        console.log(`[Challenge] Recording match completion for ${username}`);

        try {
            // Check if we need to reset daily challenge
            await this.checkAndResetChallenge();

            // Get current match count BEFORE incrementing
            const matchesStr = await redis.get(CHALLENGE_DAILY_MATCHES);
            const currentMatches = matchesStr ? parseInt(matchesStr) : 0;

            // Only record if challenge is not yet completed
            if (currentMatches < CHALLENGE_GOAL) {
                // Increment match count
                const newCount = await redis.incrBy(CHALLENGE_DAILY_MATCHES, 1);

                // Add user to contributors hash (using hSet with username as field)
                await redis.hSet(CHALLENGE_DAILY_CONTRIBUTORS, { [username]: '1' });

                console.log(`[Challenge] Match recorded. Total: ${newCount}/${CHALLENGE_GOAL}`);
            } else {
                console.log(
                    `[Challenge] Challenge already completed (${currentMatches}/${CHALLENGE_GOAL}). Not recording match for ${username}`
                );
            }
        } catch (error) {
            console.error('[Challenge] Error recording match:', error);
        }
    }

    /**
     * Get current challenge status
     */
    async getChallengeStatus(username?: string): Promise<ChallengeData> {
        try {
            // Check if we need to reset
            await this.checkAndResetChallenge();

            // Get current match count
            const matchesStr = await redis.get(CHALLENGE_DAILY_MATCHES);
            const currentMatches = matchesStr ? parseInt(matchesStr) : 0;

            // Get contributor count (number of fields in hash)
            const contributorCount = await redis.hLen(CHALLENGE_DAILY_CONTRIBUTORS);

            // Check if user contributed
            let userContributed = false;
            if (username) {
                const userValue = await redis.hGet(CHALLENGE_DAILY_CONTRIBUTORS, username);
                userContributed = userValue !== undefined;
            }

            return {
                currentMatches,
                goalMatches: CHALLENGE_GOAL,
                isCompleted: currentMatches >= CHALLENGE_GOAL,
                contributorCount,
                userContributed,
            };
        } catch (error) {
            console.error('[Challenge] Error getting challenge status:', error);
            return {
                currentMatches: 0,
                goalMatches: CHALLENGE_GOAL,
                isCompleted: false,
                contributorCount: 0,
                userContributed: false,
            };
        }
    }

    /**
     * Check if challenge needs to be reset (daily at midnight)
     */
    private async checkAndResetChallenge(): Promise<void> {
        try {
            const lastResetStr = await redis.get(CHALLENGE_DAILY_RESET);
            const lastReset = lastResetStr ? parseInt(lastResetStr) : 0;
            const now = Date.now();

            // Check if we need to reset (24 hours)
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (now - lastReset > oneDayMs) {
                console.log('[Challenge] Resetting daily challenge');
                await redis.del(CHALLENGE_DAILY_MATCHES);
                await redis.del(CHALLENGE_DAILY_CONTRIBUTORS);
                await redis.set(CHALLENGE_DAILY_RESET, now.toString());
            }
        } catch (error) {
            console.error('[Challenge] Error checking/resetting challenge:', error);
        }
    }

    /**
     * Get list of contributors
     */
    async getContributors(): Promise<string[]> {
        try {
            await this.checkAndResetChallenge();
            const contributors = await redis.hKeys(CHALLENGE_DAILY_CONTRIBUTORS);
            return contributors;
        } catch (error) {
            console.error('[Challenge] Error getting contributors:', error);
            return [];
        }
    }

    /**
     * Clear challenge data (admin function)
     */
    async clearChallenge(): Promise<void> {
        console.log('[Challenge] Clearing challenge data');
        try {
            await Promise.all([
                redis.del(CHALLENGE_DAILY_MATCHES),
                redis.del(CHALLENGE_DAILY_CONTRIBUTORS),
                redis.del(CHALLENGE_DAILY_RESET),
            ]);
            console.log('[Challenge] Challenge data cleared successfully');
        } catch (error) {
            console.error('[Challenge] Error clearing challenge:', error);
            throw error;
        }
    }
}
