import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // Splash screen customization
      appDisplayName: 'Corn Clash',
      backgroundUri: 'mysplash.png',
      buttonLabel: '🍿 Play Now',
      description: 'Catch flying popcorn in this fast-paced arcade game!',
      heading: 'Corn Clash',
      appIconUri: 'mysplash.png',
    },
    postData: {
      gameState: 'initial',
      score: 0,
    },
    subredditName: subredditName,
    title: 'corn-clash',
  });
};
