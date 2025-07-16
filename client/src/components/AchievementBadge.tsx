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
    sm: 'w-16 h-16 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-24 h-24 text-base'
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Card className={`${sizeClasses[size]} relative group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105`}>
      <CardContent className="p-2 flex flex-col items-center justify-center h-full">
        <div className={`${iconSizes[size]} mb-1`}>
          {achievement.icon}
        </div>
        <div className="text-center leading-tight">
          <div className="font-semibold truncate w-full">{achievement.achievementName}</div>
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
          <div className="font-medium">{achievement.achievementName}</div>
          <div className="text-gray-300">{achievement.description}</div>
          <div className="text-gray-400 text-xs mt-1">
            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      </CardContent>
    </Card>
  );
}