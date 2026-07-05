import axios from "@/lib/axios";

export interface CallTokenResponse {
  token: string;
  uid: string;
  appId: string;
}

export const getCallToken = async (channelName: string): Promise<CallTokenResponse> => {
  const res = await axios.get(`/calls/token`, {
    params: { channelName }
  });
  return res.data;
};
