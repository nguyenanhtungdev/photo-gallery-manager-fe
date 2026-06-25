"use client";

import { io, type Socket } from "socket.io-client";
import { getApiKey, getApiOrigin } from "@/lib/api-config";
import type { Project } from "@/lib/mock-data";

type ProjectShareUpdatedEventDetail = {
  project: Project;
};

type ProjectShareSocketEvents = {
  onProjectUpdated?: (detail: ProjectShareUpdatedEventDetail) => void;
};

let projectShareSocket: Socket | null = null;
let activeShareToken: string | null = null;

function createProjectShareSocket(shareToken: string) {
  if (projectShareSocket && activeShareToken === shareToken) {
    return projectShareSocket;
  }

  projectShareSocket?.disconnect();

  projectShareSocket = io(`${getApiOrigin()}/project-share`, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: {
      shareToken,
      apiKey: getApiKey(),
    },
  });
  activeShareToken = shareToken;

  return projectShareSocket;
}

export function subscribeToProjectShareRealtime(
  shareToken: string,
  { onProjectUpdated }: ProjectShareSocketEvents,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const socket = createProjectShareSocket(shareToken);

  if (onProjectUpdated) {
    socket.on("project.share.updated", onProjectUpdated);
  }

  if (!socket.connected) {
    socket.connect();
  }

  return () => {
    if (onProjectUpdated) {
      socket.off("project.share.updated", onProjectUpdated);
    }
  };
}

export function disconnectProjectShareRealtime() {
  projectShareSocket?.disconnect();
  projectShareSocket = null;
  activeShareToken = null;
}
