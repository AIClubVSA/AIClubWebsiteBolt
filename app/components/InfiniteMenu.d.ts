export interface InfiniteMenuItem {
  image: string;
  link: string;
  title: string;
  description: string;
}

export interface InfiniteMenuProps {
  items?: InfiniteMenuItem[];
  scale?: number;
}

declare const InfiniteMenu: (props: InfiniteMenuProps) => JSX.Element;
export default InfiniteMenu;
