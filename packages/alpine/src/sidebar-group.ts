/** Initial configuration accepted by `x-data="lyraSidebarGroup(...)"`. */
export interface LyraSidebarGroupOptions {
  /** Whether the group starts with its consumer-rendered items unmounted. Default: `false`. */
  defaultCollapsed?: boolean;
}

type Binding = Record<string, unknown>;

interface LyraSidebarGroupData {
  collapsed: boolean;
  root: Binding;
  label: Binding;
  item: Binding;
}

interface LyraSidebarGroupMagics {
  $el: HTMLElement;
  $dispatch(name: string, detail?: Record<string, unknown>): void;
}

type LyraSidebarGroupState = LyraSidebarGroupData & LyraSidebarGroupMagics;

/**
 * A sidebar group over consumer-rendered markup.
 *
 * A group is collapsible when its label uses `x-bind="label"`; omit that binding for a plain,
 * non-collapsible label. This is the Alpine equivalent of React's `collapsible` prop. To unmount
 * items while collapsed, wrap `.lyra-sbgroup__items` in `<template x-if="!collapsed">`.
 */
export function lyraSidebarGroup({
  defaultCollapsed = false,
}: LyraSidebarGroupOptions = {}): LyraSidebarGroupData {
  const state: LyraSidebarGroupData & ThisType<LyraSidebarGroupState> = {
    collapsed: defaultCollapsed,

    root: {
      [':class']() {
        // Object syntax also removes a server-rendered collapsed modifier on expansion.
        return { 'lyra-sbgroup--collapsed': this.collapsed };
      },
    },

    label: {
      type: 'button',
      [':aria-expanded']() {
        return String(!this.collapsed);
      },
      ['@click']() {
        this.collapsed = !this.collapsed;
      },
    },

    item: {
      type: 'button',
      ['@click']() {
        this.$dispatch('lyra:select', { id: this.$el.dataset.id ?? '' });
      },
    },
  };

  return state;
}
