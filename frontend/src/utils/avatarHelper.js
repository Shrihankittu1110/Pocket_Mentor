// Helper to ensure human-style avatars across the app

export const getHumanAvatar = (userOrImage, fallbackName = 'Student') => {
  if (typeof userOrImage === 'object' && userOrImage !== null) {
    const img = userOrImage.profileImage;
    const name = userOrImage.name || fallbackName;
    if (img && !img.includes('bottts')) {
      return img;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  }

  if (typeof userOrImage === 'string' && userOrImage.trim()) {
    if (userOrImage.includes('bottts')) {
      return userOrImage.replace('bottts', 'avataaars');
    }
    return userOrImage;
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`;
};

export const HUMAN_AVATAR_PRESETS = [
  { id: 'Alex', name: 'Curious Learner', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'Sophia', name: 'Bookworm', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
  { id: 'Marcus', name: 'Tech Enthusiast', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
  { id: 'Maya', name: 'Creative Mind', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya' },
  { id: 'Jordan', name: 'Study Mentor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
  { id: 'Priya', name: 'Code Prodigy', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { id: 'Lucas', name: 'Campus Scholar', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
  { id: 'Emma', name: 'Exam Ace', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
];
