import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onRoomCreated: (room: any) => void;
}

export function CreateRoomModal({ open, onClose, onRoomCreated }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("2");
  const [isPrivate, setIsPrivate] = useState(false);
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const response = await apiRequest('POST', '/api/rooms', roomData);
      return response.json();
    },
    onSuccess: (room) => {
      onRoomCreated(room);
      onClose();
      resetForm();
      toast({
        title: "Room Created",
        description: `Room ${room.code} created successfully`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRoomName("");
    setMaxPlayers("2");
    setIsPrivate(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate({
      name: roomName.trim(),
      maxPlayers: parseInt(maxPlayers),
      isPrivate,
    });
  };

  const handleClose = () => {
    if (!createRoomMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Room</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomName" className="text-sm font-medium text-gray-300">
              Room Name
            </Label>
            <Input
              id="roomName"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white mt-1"
              disabled={createRoomMutation.isPending}
            />
          </div>
          
          <div>
            <Label htmlFor="maxPlayers" className="text-sm font-medium text-gray-300">
              Max Players
            </Label>
            <Select 
              value={maxPlayers} 
              onValueChange={setMaxPlayers}
              disabled={createRoomMutation.isPending}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="2">2 Players</SelectItem>
                <SelectItem value="52">2 Players + 50 Spectators</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="border-slate-600"
              disabled={createRoomMutation.isPending}
            />
            <Label htmlFor="private" className="text-sm text-gray-300">
              Private Room
            </Label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createRoomMutation.isPending}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRoomMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createRoomMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
