export interface FlowingMenuItem {
  link: string;
  text: string;
  image: string;
}

export interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
}

declare const FlowingMenu: (props: FlowingMenuProps) => JSX.Element;
export default FlowingMenu;
