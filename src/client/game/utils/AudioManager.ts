import { Scene } from 'phaser';

/**
 * AudioManager - Singleton class to manage background music across scenes
 * Ensures smooth transitions and prevents multiple music tracks from playing simultaneously
 * Uses the game's sound manager to persist music across scene changes
 */
export class AudioManager {
    private static instance: AudioManager | null = null;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private currentMusicKey: string | null = null;
    private scene: Scene | null = null;

    private constructor() { }

    /**
     * Get the singleton instance of AudioManager
     */
    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * Initialize the AudioManager with a scene context
     */
    init(scene: Scene): void {
        this.scene = scene;
        // Try to unlock audio context on init
        this.unlockAudio();
    }

    /**
     * Unlock audio context (required for browser autoplay policies)
     * This should be called on user interaction
     */
    unlockAudio(): void {
        if (!this.scene) {
            return;
        }

        // Resume the audio context if it's suspended
        const soundManager = this.scene.game.sound as any;
        if (soundManager.context) {
            const context = soundManager.context as AudioContext;
            if (context.state === 'suspended') {
                context.resume().catch(() => {
                    // Silently fail - this is expected on first load
                });
            }
        }
    }

    /**
     * Play background music with fade-in effect
     * @param key - The audio key to play
     * @param volume - Volume level (0-1), default 0.5
     * @param loop - Whether to loop the music, default true
     */
    playMusic(key: string, volume: number = 0.5, loop: boolean = true): void {
        if (!this.scene) {
            console.warn('[AudioManager] Not initialized with a scene');
            return;
        }

        // Try to unlock audio on every play attempt
        this.unlockAudio();

        // If the same music is already playing and actually making sound, do nothing
        if (this.currentMusicKey === key && this.currentMusic?.isPlaying) {
            // Still try to resume if paused due to browser policy
            if (this.currentMusic.isPaused) {
                this.currentMusic.resume();
            }
            return;
        }

        // Stop current music with fade-out if it exists
        if (this.currentMusic) {
            
            if (this.currentMusic.isPlaying) {
                // Fade out and then start new music
                this.scene.tweens.add({
                    targets: this.currentMusic,
                    volume: 0,
                    duration: 500,
                    onComplete: () => {
                        if (this.currentMusic) {
                            this.currentMusic.stop();
                            this.currentMusic.destroy();
                        }
                        this.startNewMusic(key, volume, loop);
                    }
                });
            } else {
                // Not playing, just destroy and start new
                this.currentMusic.destroy();
                this.startNewMusic(key, volume, loop);
            }
        } else {
            // No current music, start immediately
            this.startNewMusic(key, volume, loop);
        }
    }

    /**
     * Start playing new music using the game's sound manager
     * This ensures music persists across scene changes
     */
    private startNewMusic(key: string, volume: number, loop: boolean): void {
        if (!this.scene) {
            return;
        }

        try {
            // Use the game's sound manager instead of scene's to persist across scenes
            this.currentMusic = this.scene.game.sound.add(key, {
                volume: 0,
                loop: loop
            });

            this.currentMusic.play();
            this.currentMusicKey = key;

            // Fade in the new music
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: volume,
                duration: 500
            });
        } catch (error) {
            console.error(`[AudioManager] Error starting music ${key}:`, error);
        }
    }

    /**
     * Stop the currently playing music with fade-out
     */
    stopMusic(): void {
        if (!this.scene || !this.currentMusic) {
            return;
        }

        if (this.currentMusic.isPlaying) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: 500,
                onComplete: () => {
                    if (this.currentMusic) {
                        this.currentMusic.stop();
                        this.currentMusic.destroy();
                        this.currentMusic = null;
                        this.currentMusicKey = null;
                    }
                }
            });
        }
    }

    /**
     * Pause the currently playing music
     */
    pauseMusic(): void {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    /**
     * Resume the paused music
     */
    resumeMusic(): void {
        if (this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }

    /**
     * Set the volume of the currently playing music
     */
    setVolume(volume: number): void {
        if (this.currentMusic && 'setVolume' in this.currentMusic) {
            (this.currentMusic as any).setVolume(volume);
        }
    }

    /**
     * Get the current music key
     */
    getCurrentMusicKey(): string | null {
        return this.currentMusicKey;
    }

    /**
     * Check if music is currently playing
     */
    isPlaying(): boolean {
        return this.currentMusic?.isPlaying ?? false;
    }
}
