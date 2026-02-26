// Legacy entrypoint kept for backwards compatibility.
// The real implementation now lives in the ui folder and supports
// both dragging and resizing.  Existing imports of `DraggableModal`
// will continue to work, but new code should import
// `DraggableResizableModal` directly from `@/components/ui`.

import DraggableResizableModal from './ui/draggable-resizable-modal';

export default DraggableResizableModal;
