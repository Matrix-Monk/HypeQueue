import React, { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { YouTubeEvent, YouTubePlayer } from "react-youtube";

interface Props {
  videoId: string;
  isHost: boolean;
  socket: WebSocket;
  roomId: string;
  userId: string;
  onPlaybackError?: () => void;
}

export default function YouTubePlayer({
  videoId: videoIdProp,
  isHost,
  socket,
  roomId,
  userId,
  onPlaybackError,
}: // fetchQueue,
Props) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [videoId, setVideoId] = useState<string>(videoIdProp || "");
  const [isSyncing, setIsSyncing] = useState(false);

  // Keep local state in sync with prop
  useEffect(() => {
    if (videoIdProp !== videoId) {
      setVideoId(videoIdProp);
    }
  }, [videoIdProp]);

  // Maintain host playback in background tabs
  useEffect(() => {
    if (!isHost) return;
    let interval: NodeJS.Timeout | null = null;

    const maintainPlayback = () => {
      const player = playerRef.current;
      if (!player) return;

      if (document.visibilityState === "hidden") {
        if (player.getPlayerState() === window.YT.PlayerState.PAUSED) {
          player.playVideo();
        }
        interval = setInterval(() => {
          if (player.getPlayerState() === window.YT.PlayerState.PAUSED) {
            player.playVideo();
          }
        }, 2000);
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    document.addEventListener("visibilitychange", maintainPlayback);
    return () => {
      document.removeEventListener("visibilitychange", maintainPlayback);
      if (interval) clearInterval(interval);
    };
  }, [isHost]);

  // Non-host requests host's current state when player becomes ready or video changes
  useEffect(() => {
    if (
      !isHost &&
      playerReady &&
      videoId &&
      socket?.readyState === WebSocket.OPEN
    ) {
      setIsSyncing(true);

      const timeout = setTimeout(() => {
        socket.send(
          JSON.stringify({
            type: "REQUEST_PLAYER_STATE",
            payload: {
              roomId,
              requesterId: userId,
            },
          })
        );
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [videoId, playerReady, isHost, socket, roomId, userId]);

  // WebSocket sync handling
  useEffect(() => {
    if (!socket || !videoId) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      const player = playerRef.current;

      if (!player) return;

      if (!isHost && message.type === "SONG_CHANGED") {
        console.log("🔁 SONG_CHANGED received:", message.payload);

        const { videoId: newVideoId } = message.payload;

        console.log("📡 SONG_CHANGED received:", newVideoId);

        // Update videoId in player
        if (newVideoId && newVideoId !== videoId) {
          setIsSyncing(true);
          console.log("🔄 Updating videoId to:", newVideoId);
          setVideoId(newVideoId); // triggers video loading + sync logic
        }

        // Refetch the song queue
        // if (typeof fetchQueue === "function") {
        //   console.log("🔄 Fetching updated queue after SONG_CHANGED");
        //   fetchQueue();
        // }

        // Ask for player state (to sync time & play/pause)
        if (socket.readyState === WebSocket.OPEN) {
          console.log("📡 Requesting player state from host");
          socket.send(
            JSON.stringify({
              type: "REQUEST_PLAYER_STATE",
              payload: {
                roomId,
                requesterId: userId,
              },
            })
          );
        }
        return;
      }

      if (!isHost && message.type === "PLAYER_EVENT") {
        const { action, currentTime, videoId: vid } = message.payload;
        if (vid !== videoId) return;

        const drift = Math.abs(player.getCurrentTime() - currentTime);
        if (drift > 0.5) player.seekTo(currentTime, true);

        if (action === "play") {
          player.playVideo();
        } else if (action === "pause") {
          player.pauseVideo();
        } else if (action === "ended") {
          player.seekTo(0, true);
          player.pauseVideo();
        }
      }

      // if (message.type === "PLAYER_EVENT" && !isHost) {
      //   const { action, currentTime, videoId: vid } = message.payload;
      //   if (vid !== videoId) return;

      //   const drift = Math.abs(player.getCurrentTime() - currentTime);
      //   if (drift > 0.5) player.seekTo(currentTime, true);

      //   if (
      //     action === "play" &&
      //     player.getPlayerState() !== window.YT.PlayerState.PLAYING
      //   ) {
      //     player.playVideo();
      //   } else if (action === "pause") {
      //     player.pauseVideo();
      //   } else if (action === "ended") {
      //     player.seekTo(0, true);
      //     player.pauseVideo();
      //   }
      // }

      if (isHost && message.type === "SEND_PLAYER_STATE") {
        const { toUserId } = message.payload;
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "PLAYER_STATE_RESPONSE",
              payload: {
                roomId,
                toUserId,
                userId,
                action:
                  player.getPlayerState() === window.YT.PlayerState.PLAYING
                    ? "play"
                    : "pause",
                currentTime: player.getCurrentTime(),
                videoId,
              },
            })
          );
        }
      }

      if (!isHost && message.type === "PLAYER_STATE_RESPONSE") {
        const { action, currentTime, videoId: vid, toUserId } = message.payload;
        if (toUserId !== userId || vid !== videoId) return;

        setIsSyncing(false);

        player.seekTo(currentTime, true);
        if (action === "play") player.playVideo();
        else player.pauseVideo();
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [isHost, socket, videoId, roomId, userId]);

  // Load video on change
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !player.loadVideoById || !player.getIframe) return;

    const attemptLoad = async () => {
      try {
        const iframe = await player.getIframe();
        if (!iframe?.contentWindow?.postMessage) return;

        player.loadVideoById(videoId);

        if (isHost) {
          player.playVideo();
          const currentTime = player.getCurrentTime();

          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "PLAYER_EVENT",
                payload: {
                  roomId,
                  userId,
                  action: "play",
                  currentTime,
                  videoId,
                },
              })
            );
          }
        }
      } catch (err) {
        console.error("Error loading video:", err);
      }
    };

    if (playerReady && videoId) {
      setTimeout(attemptLoad, 300);
    }
  }, [videoId, playerReady]);

  // When player is ready
  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setPlayerReady(true);
  };

  // Host sends state updates
  const handlePlayerStateChange = (event: YouTubeEvent) => {
    const player = event.target;
    const state = player.getPlayerState();

    if (!isHost || !socket || socket.readyState !== WebSocket.OPEN) return;

    if (
      state === window.YT.PlayerState.PLAYING ||
      state === window.YT.PlayerState.PAUSED
    ) {
      socket.send(
        JSON.stringify({
          type: "PLAYER_EVENT",
          payload: {
            roomId,
            userId,
            action: state === window.YT.PlayerState.PLAYING ? "play" : "pause",
            currentTime: player.getCurrentTime(),
            videoId,
          },
        })
      );
    }

    if (state === window.YT.PlayerState.ENDED) {
      socket.send(
        JSON.stringify({
          type: "PLAYER_EVENT",
          payload: {
            roomId,
            userId,
            action: "ended",
            currentTime: 0,
            videoId,
          },
        })
      );
    }
  };

  const onError = (event: YouTubeEvent) => {
    const errorCode = event.data;

    // YouTube error codes:
    // 101 or 150 = Playback on other websites has been disabled
    if (errorCode === 101 || errorCode === 150) {
      console.warn("⚠️ Playback error: embedding disabled");
      onPlaybackError?.();
    } else {
      console.warn("⚠️ Unhandled YouTube error:", errorCode);
    }
  };

  return (
    <div className="w-full aspect-video relative">
      <YouTube
        videoId={videoId}
        onReady={onReady}
        onStateChange={handlePlayerStateChange}
        className="absolute top-0 left-0 w-full h-full"
        iframeClassName="h-full w-full"
        opts={{
          playerVars: {
            autoplay: isHost ? 1 : 0,
            controls: isHost ? 1 : 0,
            disablekb: 1,
            modestbranding: 1,
          },
        }}
        onError={onError}
      />

      {!isHost && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            backgroundColor: "transparent",
            cursor: "not-allowed",
          }}
        />
      )}

      {isSyncing && !isHost && (
        <div className="absolute inset-0 z-20 bg-black/50 text-white flex items-center justify-center text-xl">
          Syncing with host...
        </div>
      )}
    </div>
  );
}
