import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, UserCheck, UserX, Trophy, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  wins: number;
  losses: number;
  draws: number;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  requestedId: string;
  status: string;
  sentAt: string;
  respondedAt: string | null;
  requester: User;
  requested: User;
}

interface HeadToHeadStats {
  totalGames: number;
  userWins: number;
  friendWins: number;
  draws: number;
  userWinRate: number;
  friendWinRate: number;
}

export function Friends() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ['/api/friends'],
    enabled: isOpen,
  });

  // Fetch friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    enabled: isOpen,
  });

  // Fetch head-to-head stats for selected friend
  const { data: headToHeadStats } = useQuery<HeadToHeadStats>({
    queryKey: ['/api/friends', selectedFriend?.id, 'stats'],
    enabled: !!selectedFriend,
  });

  // Send friend request mutation
  const sendFriendRequest = useMutation({
    mutationFn: async (requestedId: string) => {
      return await apiRequest('POST', '/api/friends/request', { requestedId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });
      setSearchName('');
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  // Respond to friend request mutation
  const respondToFriendRequest = useMutation({
    mutationFn: async ({ requestId, response }: { requestId: string; response: 'accepted' | 'rejected' }) => {
      return await apiRequest('POST', '/api/friends/respond', { requestId, response });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request responded to successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to friend request",
        variant: "destructive",
      });
    },
  });

  // Remove friend mutation
  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      return await apiRequest('DELETE', `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      setSelectedFriend(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  // State for search results
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Find users by name for friend requests
  const findUsersByName = async () => {
    if (!searchName.trim()) return;

    setIsSearching(true);
    try {
      const response = await apiRequest('POST', '/api/users/search', { name: searchName.trim() });
      const data = await response.json();
      
      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No users found",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Users className="h-4 w-4 mr-2" />
          Friends
          {friendRequests.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {friendRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests 
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add">Add Friend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            {friendsLoading ? (
              <div className="text-center py-8">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No friends yet. Add some friends to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="flex items-center gap-3">
                      {friend.profileImageUrl ? (
                        <img
                          src={friend.profileImageUrl}
                          alt={`${friend.firstName} ${friend.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {friend.firstName[0]}{friend.lastName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {friend.firstName} {friend.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {friend.wins}W-{friend.losses}L-{friend.draws}D
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFriend.mutate(friend.id);
                      }}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : friendRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending friend requests
              </div>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {request.requester.profileImageUrl ? (
                        <img
                          src={request.requester.profileImageUrl}
                          alt={`${request.requester.firstName} ${request.requester.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {request.requester.firstName[0]}{request.requester.lastName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {request.requester.firstName} {request.requester.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sent on {formatDate(request.sentAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'accepted' })}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'rejected' })}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Find friend by name
              </label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter name to search"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      findUsersByName();
                    }
                  }}
                />
                <Button
                  onClick={findUsersByName}
                  disabled={!searchName.trim() || isSearching}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Search Results:</div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.wins}W-{user.losses}L-{user.draws}D
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendFriendRequest.mutate(user.id)}
                      disabled={sendFriendRequest.isPending}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Head-to-head stats modal */}
        {selectedFriend && (
          <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  Head-to-Head with {selectedFriend.firstName} {selectedFriend.lastName}
                </DialogTitle>
              </DialogHeader>
              
              {headToHeadStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {headToHeadStats.userWins}
                      </div>
                      <div className="text-sm text-muted-foreground">Your Wins</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {headToHeadStats.friendWins}
                      </div>
                      <div className="text-sm text-muted-foreground">Their Wins</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.totalGames}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Games</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.draws}
                      </div>
                      <div className="text-sm text-muted-foreground">Draws</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.userWinRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Your Win Rate</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Loading stats...</div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}