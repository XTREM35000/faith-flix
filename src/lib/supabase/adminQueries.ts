// This file is no longer used - see videoQueries.ts and commentQueries.ts instead
// Keeping for backwards compatibility but deprecated

import { 
  fetchVideos, 
  updateVideo, 
  deleteVideo 
} from './videoQueries';

import { 
  fetchRecentComments, 
  moderateComment, 
  deleteComment 
} from './commentQueries';

export { 
  fetchVideos, 
  updateVideo, 
  deleteVideo,
  fetchRecentComments,
  moderateComment,
  deleteComment,
};

// Paroisses (administration multi-paroisses, super_admin / RLS)
export {
  fetchParoissesForAdmin,
  upsertParoisse,
  deleteParoisseById,
  formatParoisseSaveError,
  type ParoisseAdminRow,
  type ParoisseUpsertPayload,
} from './paroisseAdminQueries';
