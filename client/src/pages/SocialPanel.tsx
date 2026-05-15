import { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Flame } from 'lucide-react';

interface Friend {
  friendship_id: number;
  friend_id: number;
  friend_username: string;
  friend_streak: number;
}

interface PendingRequest {
  friendship_id: number;
  sender_id: number;
  sender_username: string;
  sender_streak: number;
}

const MOCK_FRIENDS: Friend[] = [
  { friendship_id: 101, friend_id: 2, friend_username: 'LogicMaster', friend_streak: 8 },
  { friendship_id: 102, friend_id: 4, friend_username: 'ByteMe', friend_streak: 3 },
];

const MOCK_PENDING: PendingRequest[] = [
  { friendship_id: 201, sender_id: 3, sender_username: 'SyntaxTerror', sender_streak: 12 },
  { friendship_id: 202, sender_id: 5, sender_username: 'CPlusPlusPro', sender_streak: 5 },
];

export default function SocialPanel() {
  const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Assuming logged in user is ID 1
  const userId = 1;

  useEffect(() => {
    const fetchSocialData = async () => {
      setLoading(true);
      try {
        const [friendsRes, pendingRes] = await Promise.all([
          fetch(`http://localhost:5000/api/users/${userId}/friends`),
          fetch(`http://localhost:5000/api/users/${userId}/friends/pending`)
        ]);

        if (friendsRes.ok && pendingRes.ok) {
          setFriends(await friendsRes.json());
          setPendingRequests(await pendingRes.json());
        } else {
          setFriends(MOCK_FRIENDS);
          setPendingRequests(MOCK_PENDING);
        }
      } catch (err) {
        console.warn("Backend not reachable. Using mock social data.");
        setFriends(MOCK_FRIENDS);
        setPendingRequests(MOCK_PENDING);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialData();
  }, [userId]);

  const handleAcceptRequest = async (friendshipId: number) => {
    try {
      const res = await fetch('http://localhost:5000/api/friends/accept', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId })
      });

      if (res.ok) {
        // Move from pending to friends
        const reqToAccept = pendingRequests.find(r => r.friendship_id === friendshipId);
        if (reqToAccept) {
          setPendingRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
          setFriends(prev => [...prev, {
            friendship_id: friendshipId,
            friend_id: reqToAccept.sender_id,
            friend_username: reqToAccept.sender_username,
            friend_streak: reqToAccept.sender_streak
          }]);
        }
      } else {
        // Mock success fallback
        const reqToAccept = pendingRequests.find(r => r.friendship_id === friendshipId);
        if (reqToAccept) {
          setPendingRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
          setFriends(prev => [...prev, {
            friendship_id: friendshipId,
            friend_id: reqToAccept.sender_id,
            friend_username: reqToAccept.sender_username,
            friend_streak: reqToAccept.sender_streak
          }]);
        }
      }
    } catch (err) {
      console.warn("Mocking accept friend request.");
      const reqToAccept = pendingRequests.find(r => r.friendship_id === friendshipId);
      if (reqToAccept) {
        setPendingRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
        setFriends(prev => [...prev, {
          friendship_id: friendshipId,
          friend_id: reqToAccept.sender_id,
          friend_username: reqToAccept.sender_username,
          friend_streak: reqToAccept.sender_streak
        }]);
      }
    }
  };

  const handleDeclineRequest = (friendshipId: number) => {
    // We didn't build a decline route, so we just remove it from UI state for mock purposes
    setPendingRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in relative">
      
      {/* Decorative Blur */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white mb-3">Your Network</h2>
        <p className="text-gray-400">Manage your coding companions and incoming requests.</p>
      </div>

      <div className="glass-card overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-dark-800/50">
          <button 
            className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-all ${activeTab === 'friends' ? 'text-primary-400 border-b-2 border-primary-400 bg-white/5' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users size={18} />
            My Friends ({friends.length})
          </button>
          <button 
            className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-all ${activeTab === 'pending' ? 'text-primary-400 border-b-2 border-primary-400 bg-white/5' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            onClick={() => setActiveTab('pending')}
          >
            <UserPlus size={18} />
            Pending Requests 
            {pendingRequests.length > 0 && (
              <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="h-full flex items-center justify-center animate-pulse text-primary-400 py-20">
              Loading Network...
            </div>
          ) : (
            <>
              {activeTab === 'friends' && (
                <div className="space-y-4 animate-fade-in">
                  {friends.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                      You haven't added any friends yet. Check the Leaderboard to find other coders!
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div key={friend.friendship_id} className="bg-dark-800/80 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-lg font-bold text-white relative">
                            {friend.friend_username.charAt(0).toUpperCase()}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-800 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-200">{friend.friend_username}</h4>
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Flame size={12} className="text-orange-500" />
                              {friend.friend_streak} Day Streak
                            </span>
                          </div>
                        </div>
                        <button className="text-sm text-gray-400 hover:text-white transition-colors">
                          View Profile
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'pending' && (
                <div className="space-y-4 animate-fade-in">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                      No pending requests at the moment.
                    </div>
                  ) : (
                    pendingRequests.map(request => (
                      <div key={request.friendship_id} className="bg-dark-800/80 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-dark-700 border border-white/10 rounded-full flex items-center justify-center text-lg font-bold text-gray-300">
                            {request.sender_username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-200">{request.sender_username}</h4>
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Flame size={12} className="text-orange-500" />
                              {request.sender_streak} Day Streak
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAcceptRequest(request.friendship_id)}
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 p-2 rounded-lg transition-colors"
                            title="Accept Request"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeclineRequest(request.friendship_id)}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 p-2 rounded-lg transition-colors"
                            title="Decline Request"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
