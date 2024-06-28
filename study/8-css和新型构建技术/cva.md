# cva (class-variance-authority)

cva 全称为 class-variance-authority, 它是一个非常适合制作那种，创建控制Css变体方法的类库，它非常的契合像 tailwindcss 这类的原子化思想。

在很多时候我们自己封装组件, 尤其是使用原子化思想去编写 css , 然后去封装组件，用它

![cav-diff](/study/img/cav-diff.png)

cva有这么几个模块

1. base  - 基础类
2. variants -  变种类
3. compoundVariants - 复合变种  （当满足传入的变种条件时，那么就触发此复合变种）
4. defaultVariants - 默认变种

在vue中的应用如下

```tsx
import { cva, VariantProps } from "class-variance-authority";
const index = cva(["btn"], {
  variants: {
    "type": {
      "primary": ["btn-primary"],
      "secondary": ["btn-secondary"]
    },
    "size": {
      "md": ["btn-md"],
      "xs": ["btn-xs"],
      "sm": ["btn-sm"]
    }
  },
  compoundVariants: [{
    "class": ["btn-disabled"],
    "type": ["primary"],
    "size": ["xs"]
  }],
  defaultVariants: {
    "size": "md"
  }
});
export type Props = VariantProps<typeof index>;
export default index;

```

```html

<template>
  <button :class="className">
    <slot>postcss-cva</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import buttonClass, { Props as ButtonProps } from './buttonClass'

const props = withDefaults(defineProps<{
  // ButtonProps
  type?: 'primary' | 'secondary',
  size?: 'md' | 'sm' | 'xs'
}>(), {})
const className = computed(() => {
  return buttonClass(props)
}) 
</script>
```

在react中的应用（代码来源于 shadcn/ui 的 button）

```tsx
import { cva, type VariantProps } from "class-variance-authority"
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9  px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// link button

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

```

