// Service 7: Edge Coins wallet + reward redemption.
import { request } from './api.js'

export const rewardsService = {
  getWallet: (token) => request('/api/rewards', { token }),
  redeem: (token, payload) => request('/api/rewards/redeem', { token, method: 'POST', body: payload }),
}
