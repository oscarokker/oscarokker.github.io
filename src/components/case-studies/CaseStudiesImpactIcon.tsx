import { ChatCircleIcon } from "@phosphor-icons/react/dist/ssr/ChatCircle";
import { HeadphonesIcon } from "@phosphor-icons/react/dist/ssr/Headphones";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { MoneyIcon } from "@phosphor-icons/react/dist/ssr/Money";
import { ScalesIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import type { CaseStudyImpactIconId } from "@/data/case-studies";

const IMPACT_ICONS: Record<CaseStudyImpactIconId, Icon> = {
  lightning: LightningIcon,
  money: MoneyIcon,
  scales: ScalesIcon,
  sparkle: SparkleIcon,
  headphones: HeadphonesIcon,
  "chat-circle": ChatCircleIcon,
};

const IMPACT_ICON_SIZE = 20;

interface CaseStudyImpactIconProps {
  id: CaseStudyImpactIconId;
}

export function CaseStudyImpactIcon({ id }: CaseStudyImpactIconProps) {
  const PhosphorIcon = IMPACT_ICONS[id];

  return (
    <PhosphorIcon size={IMPACT_ICON_SIZE} weight="regular" aria-hidden />
  );
}
