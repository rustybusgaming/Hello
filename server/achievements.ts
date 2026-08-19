import { getStoredAccounts, saveStoredAccounts, getSaves } from './store';
import { Achievement, UserAchievement, Game } from '../src/types';
import { formatGameInfo } from '../src/utils/gameTitles';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_play',
    name: 'First Play',
    description: 'You played your first game on FlashHub!',
    icon: '🎮'
  },
  {
    id: 'marathon_player',
    name: 'Marathon Player',
    description: 'You have accumulated 1 hour of total playtime.',
    icon: '⏳'
  },
  {
    id: 'genre_explorer',
    name: 'Genre Explorer',
    description: 'You have played games from 3 different genres.',
    icon: '🌍'
  }
];

export function checkAchievements(userId: string) {
  const accounts = getStoredAccounts();
  const accIndex = accounts.findIndex(a => a.id === userId);
  if (accIndex === -1) return [];

  const account = accounts[accIndex];
  const earned: UserAchievement[] = account.achievements || [];
  const saves = getSaves().filter(s => s.userId === userId);
  
  let newlyEarned: Achievement[] = [];

  const hasAchievement = (id: string) => earned.some(a => a.achievementId === id);
  const awardAchievement = (id: string) => {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach && !hasAchievement(id)) {
      earned.push({ achievementId: id, earnedAt: new Date().toISOString() });
      newlyEarned.push(ach);
    }
  };

  // 1. First Play
  if (saves.length > 0) {
    awardAchievement('first_play');
  }

  // 2. Marathon Player (1 hour = 60 minutes), from the account's banked playtime rather
  //    than a sum over slots that get overwritten in place
  if ((account.totalPlaytimeMinutes || 0) >= 60) {
    awardAchievement('marathon_player');
  }

  // 3. Genre Explorer (3 different genres)
  const playedGenres = new Set<string>();
  
  saves.forEach(s => {
    const info = formatGameInfo(s.gameId, s.gameTitle);
    if (info && info.genres) {
      info.genres.forEach((genre: string) => playedGenres.add(genre));
    }
  });

  if (playedGenres.size >= 3) {
    awardAchievement('genre_explorer');
  }

  if (newlyEarned.length > 0) {
    account.achievements = earned;
    saveStoredAccounts(accounts);
  }

  return newlyEarned;
}
