import React, { useEffect, useRef } from "react";
import YouTube from "react-youtube";
import type { YouTubeEvent } from "react-youtube";


interface Props {
  videoId: string;
  isHost: boolean;
  socket: WebSocket;
  roomId: string;
  userId: string;
}

export default function YouTubePlayer({

  videoId: videoIdProp,
  isHost,
  socket,
  roomId,
  userId,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  const videoId = videoIdProp || "";

  useEffect(() => {
    if (!isHost) return;

    let interval: NodeJS.Timeout | null = null;

    const maintainPlayback = () => {
      const player = playerRef.current;
      if (!player) return;

      if (document.visibilityState === "hidden") {
        // Try to keep video playing in background
        if (player.getPlayerState() === window.YT.PlayerState.PAUSED) {
          player.playVideo();
        }

        interval = setInterval(() => {
          if (player.getPlayerState() === window.YT.PlayerState.PAUSED) {
            player.playVideo();
          }
        }, 2000); // Retry every 2 seconds
      } else {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    document.addEventListener("visibilitychange", maintainPlayback);

    return () => {
      document.removeEventListener("visibilitychange", maintainPlayback);
      if (interval) clearInterval(interval);
    };
  }, [isHost]);

  const handlePlayerStateChange = (event: YouTubeEvent) => {
    const player = event.target;
    const state = player.getPlayerState();

    if (!isHost) return;

    if (
      state === window.YT.PlayerState.PLAYING ||
      state === window.YT.PlayerState.PAUSED
    ) {
      socket?.send(
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
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      const player = playerRef.current;
      if (!player) return;

      if (message.type === "PLAYER_EVENT" && !isHost) {
        const { action, currentTime, videoId: vid } = message.payload;
        if (vid !== videoId) return;

        const drift = Math.abs(player.getCurrentTime() - currentTime);
        if (drift > 0.5) player.seekTo(currentTime, true);

        if (
          action === "play" &&
          player.getPlayerState() !== window.YT.PlayerState.PLAYING
        ) {
          player.playVideo();
        } else if (action === "pause") {
          player.pauseVideo();
        }
      }

      if (isHost && message.type === "SEND_PLAYER_STATE") {
        const { toUserId } = message.payload;
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

      if (!isHost && message.type === "PLAYER_STATE_RESPONSE") {
        const { action, currentTime, videoId: vid, toUserId } = message.payload;
        if (toUserId !== userId || vid !== videoId) return;

        player.seekTo(currentTime, true);
        if (action === "play") player.playVideo();
        else player.pauseVideo();
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [isHost, socket, videoId, roomId, userId]);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;

    if (!isHost) {
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
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 800 }}>
      <YouTube
        videoId={videoId}
        onReady={onReady}
        onStateChange={handlePlayerStateChange}
        opts={{
          playerVars: {
            autoplay: 0,
            controls: isHost ? 1 : 0,
            disablekb: 1,
            modestbranding: 1,
          },
        }}
      />

      {/* 🚫 Overlay that blocks interaction for non-hosts */}
      {!isHost && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            backgroundColor: "transparent", // optional: "rgba(0,0,0,0.1)" to indicate disabled
            cursor: "not-allowed",
          }}
        />
      )}
    </div>
  );
}
