import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { ChatCircleIcon } from "@phosphor-icons/react/dist/ssr/ChatCircle";
import { GameControllerIcon } from "@phosphor-icons/react/dist/ssr/GameController";
import { HeadphonesIcon } from "@phosphor-icons/react/dist/ssr/Headphones";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { MapTrifoldIcon } from "@phosphor-icons/react/dist/ssr/MapTrifold";
import { MoneyIcon } from "@phosphor-icons/react/dist/ssr/Money";
import { ScalesIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import { SlidersIcon } from "@phosphor-icons/react/dist/ssr/Sliders";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { WaveformIcon } from "@phosphor-icons/react/dist/ssr/Waveform";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import type { CaseStudyImpactIconId } from "@/data/case-studies";

const IMPACT_ICONS: Record<CaseStudyImpactIconId, Icon> = {
  lightning: LightningIcon,
  money: MoneyIcon,
  scales: ScalesIcon,
  sparkle: SparkleIcon,
  headphones: HeadphonesIcon,
  "game-controller": GameControllerIcon,
  map: MapTrifoldIcon,
  "arrows-clockwise": ArrowsClockwiseIcon,
  "chat-circle": ChatCircleIcon,
  sliders: SlidersIcon,
  waveform: WaveformIcon,
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
