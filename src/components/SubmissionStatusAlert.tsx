import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ContentApproval } from '@/types/database';

export const SubmissionStatusAlert = ({ submission }: { submission: ContentApproval | null }) => {
  if (!submission) return null;

  switch (submission.status) {
    case 'pending':
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3 mb-4">
          <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-700">
            <p className="font-semibold">En attente d'approbation</p>
            <p className="text-xs mt-1">
              Votre contenu a été soumis pour approbation. L'administrateur examinera votre soumission et vous notifiera dans les 24 heures.
            </p>
          </div>
        </div>
      );

    case 'approved':
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700">
            <p className="font-semibold">Approuvé</p>
            <p className="text-xs mt-1">
              Votre contenu a été approuvé et est maintenant visible.
            </p>
          </div>
        </div>
      );

    case 'rejected':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 mb-4">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold">Rejeté</p>
            {submission.rejection_reason && (
              <p className="text-xs mt-1">
                <strong>Raison:</strong> {submission.rejection_reason}
              </p>
            )}
            <p className="text-xs mt-2">
              Vous pouvez modifier et réessayer votre soumission.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default SubmissionStatusAlert;
