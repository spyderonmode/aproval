import { Card, CardContent } from "@/components/ui/card";

interface AchievementBadgeProps {
  achievement: {
    id: string;
    achievementType: string;
    achievementName: string;
    description: string;
    icon: string;
    unlockedAt: string;
    metadata?: any;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-20 h-20 text-xs',
    md: 'w-28 h-28 text-sm',
    lg: 'w-32 h-32 text-base'
  };

  const iconSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  return (
    <Card className={`${sizeClasses[size]} relative group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-110 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700/50`}>
      <CardContent className="p-3 flex flex-col items-center justify-center h-full">
        <div className={`${iconSizes[size]} mb-2 transform transition-transform duration-300 group-hover:scale-110`}>
          {achievement.icon}
        </div>
        <div className="text-center leading-tight">
          <div className="font-bold text-amber-800 dark:text-amber-200 text-xs truncate w-full">{achievement.achievementName}</div>
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 whitespace-nowrap shadow-2xl border border-gray-700">
          <div className="font-bold text-amber-300 mb-1">{achievement.achievementName}</div>
          <div className="text-gray-200 text-xs">{achievement.description}</div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-6 border-transparent border-t-gray-900"></div>
        </div>
      </CardContent>
    </Card>
  );
}