import useSWR from "swr";

import { useThreadDb } from "../../PageHome/hooks/useThreadDb";

export function useThreadSecret(threadId: string) {
  const threadDb = useThreadDb();

  const swr_ReadThreadSecret = useSWR(
    threadDb ? ["thread-db:", "ReadThreadSecret", threadId] : undefined,
    () => threadDb?.get(threadId)
  );
  const threadPassword = swr_ReadThreadSecret.data?.threadPassword;
  const pusherChannelId = swr_ReadThreadSecret.data?.pusherChannelId;

  return {
    threadPassword,
    pusherChannelId,
  };
}
