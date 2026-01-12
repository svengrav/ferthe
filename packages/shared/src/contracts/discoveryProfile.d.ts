import { AccountContext } from './accounts';
import { Result } from './results';
export interface DiscoveryProfile {
    id: string;
    accountId: string;
    lastActiveTrailId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DiscoveryProfileUpdateData {
    lastActiveTrailId?: string;
}
export interface DiscoveryProfileActions {
    getProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>;
    updateProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>;
}
