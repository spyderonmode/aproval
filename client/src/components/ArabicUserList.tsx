import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

interface ArabicUser {
  id: string;
  displayName: string;
  username: string;
  wins: number;
  winRate: number;
  totalGames: number;
  rank: number;
  profileImageUrl?: string;
}

interface ArabicUserListProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function ArabicUserList({ trigger, isOpen: controlledOpen, setIsOpen: controlledSetIsOpen }: ArabicUserListProps) {
  const [internalIsOpen, internalSetIsOpen] = React.useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalIsOpen;
  const setIsOpen = controlledSetIsOpen || internalSetIsOpen;

  const { data: users, isLoading } = useQuery<ArabicUser[]>({
    queryKey: ['/api/arabic-rankings'],
    enabled: isOpen,
    staleTime: 30000, // 30 seconds
  });

  const defaultTrigger = (
    <Button 
      variant="ghost" 
      className="flex items-center gap-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
    >
      <Trophy className="w-5 h-5 text-yellow-600" />
      <span className="font-medium">قائمة المتصدرين</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div onClick={() => setIsOpen(true)}>
          {trigger || defaultTrigger}
        </div>
      </DialogTrigger>
      <DialogContent 
        className="max-w-[95vw] max-h-[90vh] w-full mx-auto flex flex-col overflow-hidden bg-white dark:bg-gray-900 font-arabic"
        style={{ 
          fontFamily: "'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif",
          direction: 'rtl'
        }}
      >
        {/* Simple Header */}
        <div className="flex-shrink-0 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              أفضل اللاعبين
            </h2>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg">جاري التحميل...</div>
            </div>
          ) : users && users.length > 0 ? (
            users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  user.rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700' :
                  user.rank === 2 ? 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600' :
                  user.rank === 3 ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700' :
                  'bg-gray-50/50 dark:bg-gray-800/30'
                }`}
              >
                {/* Rank */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  user.rank === 1 ? 'bg-yellow-500 text-white' :
                  user.rank === 2 ? 'bg-gray-500 text-white' :
                  user.rank === 3 ? 'bg-orange-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {user.rank}
                </div>

                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={`${user.displayName}'s profile`}
                      className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-sm truncate">
                    {user.displayName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    <span dir="ltr">{user.wins}</span> فوز
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span dir="ltr">{user.winRate}%</span> • <span dir="ltr">{user.totalGames}</span> لعبة
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>لا يوجد لاعبين بعد. ابدأ باللعب لتظهر في القائمة!</p>
            </div>
          )}
        </div>

        {/* Simple Footer */}
        <div className="flex-shrink-0 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {users?.length ? `عرض ${users.length} لاعب` : ''}
            </div>
            <Button 
              onClick={() => setIsOpen(false)} 
              variant="default" 
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4"
            >
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}