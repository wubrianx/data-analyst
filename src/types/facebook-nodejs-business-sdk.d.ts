declare module 'facebook-nodejs-business-sdk' {
  const bizSdk: {
    FacebookAdsApi: {
      init(accessToken: string): void;
    };
    AdAccount: new (id: string) => {
      getInsights(fields: string[], params: Record<string, unknown>): Promise<any[]>;
      getCampaigns(fields: string[], params: Record<string, unknown>): Promise<any[]>;
    };
  };
  export default bizSdk;
}
