import { useTranslation } from '../../i18n/useTranslation';
import { getClassificationColor } from '../../utils/classification';
import type { MoveClassification } from '../../engine/types';
import './MoveCommentary.css';

interface MoveCommentaryProps {
  commentary: string | null;
  isLoading: boolean;
  classification?: MoveClassification | null;
}

export default function MoveCommentary({ commentary, isLoading, classification }: MoveCommentaryProps) {
  const { t } = useTranslation();

  const borderColor = classification ? getClassificationColor(classification) : '#CBD5E1';

  if (isLoading) {
    return (
      <div className="move-commentary loading" style={{ borderLeftColor: borderColor }}>
        <div className="commentary-spinner" />
        {t('loadingCommentary')}
      </div>
    );
  }

  if (!commentary) {
    return null;
  }

  return (
    <div className="move-commentary" style={{ borderLeftColor: borderColor }}>
      <p className="commentary-text">{commentary}</p>
    </div>
  );
}
