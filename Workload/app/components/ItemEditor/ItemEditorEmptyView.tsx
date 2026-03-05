import React, { ReactNode } from "react";
import { Stack, IStackTokens } from "@fluentui/react";
import { Text, Button } from "@fluentui/react-components";
import { ItemEditorDefaultView } from "./ItemEditorDefaultView";
import "./ItemEditor.scss"

/**
 * Task/Step interface for onboarding actions
 */
export interface EmptyStateTask {
  /** Unique identifier for the task */
  id: string;
  /** Task label/title */
  label: string;
  /** Task description (optional) */
  description?: string;
  /** Click handler for the task */
  onClick: () => void;
  /** Custom icon (optional) - Fluent UI icon slot or JSX element */
  icon?: React.ReactElement | { children: React.ReactElement };
}

/**
 * ItemEditorEmptyView Props Interface
 */
export interface ItemEditorEmptyViewProps {
  /** Title displayed in the empty state */
  title: string;
  /** Description text below the title */
  description: string;
  /** Optional image/illustration to display */
  imageSrc?: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** List of tasks/actions for the user to complete */
  tasks?: EmptyStateTask[];
  /** Optional custom content to display instead of tasks */
  customContent?: ReactNode;
  /** Optional className for custom styling */
  className?: string;
  /** Maximum width for the content container (default: 600px) */
  maxWidth?: number;
}

/**
 * ItemEditorEmptyView Component
 * 
 * A reusable empty state component following Microsoft Fabric UX System guidelines.
 * Provides a consistent onboarding experience with customizable tasks.
 * 
 * **Built on ItemEditorView**: This component uses ItemEditorView internally,
 * displaying the empty state content in the center panel. This ensures consistent
 * layout and styling with other view components.
 * 
 * ## Design Principles
 * - Clear visual hierarchy with title, description, and actions
 * - Optional illustration to reduce cognitive load
 * - Task-based onboarding with clear call-to-actions
 * - Responsive design with proper spacing tokens
 * - Accessibility-first with proper ARIA labels and semantic HTML
 * - Consistent layout using ItemEditorView architecture
 * 
 * ## Usage Example
 *
 * ```tsx
 * import { ItemEditorEmptyView } from "../../components/ItemEditor";
 *
 * const tasks = [
 *   {
 *     id: 'start',
 *     label: 'Get Started',
 *     description: 'Learn the basics',
 *     onClick: () => navigate('getting-started'),
 *     appearance: 'primary'
 *   },
 *   {
 *     id: 'docs',
 *     label: 'View Documentation',
 *     onClick: () => openDocs(),
 *     appearance: 'secondary'
 *   }
 * ];
 * 
 * <ItemEditorEmptyView
 *   title="Welcome to MyItem!"
 *   description="Get started by completing the tasks below"
 *   imageSrc="/assets/items/MyItem/empty.svg"
 *   imageAlt="Empty state"
 *   tasks={tasks}
 * />
 * ```
 * 
 * ## Fabric UX Compliance
 * - Uses Fabric design tokens for spacing, colors, typography
 * - Minimum 32px touch targets for all buttons
 * - Proper color contrast (WCAG 2.1 AA)
 * - Responsive layout with max-width constraint
 * - Semantic HTML structure
 * 
 * @see {@link https://react.fluentui.dev/} Fluent UI v9 Documentation
 * @see {@link ../../../docs/components/ItemEditor/ItemEditorEmptyView.md} - Complete ItemEditorEmptyView documentation
 * @see {@link ../../../docs/components/ItemEditor.md} - ItemEditor integration patterns
 */
export function ItemEditorEmptyView({
  title,
  description,
  imageSrc,
  imageAlt = "Empty state illustration",
  tasks = [],
  customContent,
  className = "",
  maxWidth = 600
}: ItemEditorEmptyViewProps) {
  
  // Stack tokens for consistent spacing using Fabric design tokens
  const containerTokens: IStackTokens = { childrenGap: 24 };
  const headerTokens: IStackTokens = { childrenGap: 8 };

  // Build the empty state content
  const emptyStateContent = (
    <Stack 
      className={`item-editor-view-empty ${className}`.trim()}
      horizontalAlign="center" 
      role="main"
      aria-label="Empty state"
    >
      <Stack 
        className="empty-state-content" 
        tokens={containerTokens} 
        horizontalAlign="center"
        style={{ maxWidth: `${maxWidth}px` }}
      >
        {/* Illustration/Image Section */}
        {imageSrc && (
          <Stack.Item>
            <img
              src={imageSrc}
              alt={imageAlt}
              className="empty-state-image"
              aria-hidden={imageAlt ? "false" : "true"}
            />
          </Stack.Item>
        )}

        {/* Text Content Section */}
        <Stack 
          className="empty-state-text-container" 
          tokens={headerTokens} 
          horizontalAlign="center"
        >
          <div className="empty-state-header">
            <h2>{title}</h2>
            <Text className="empty-state-description">
              {description}
            </Text>
          </div>
        </Stack>

        {/* Tasks/Actions Section or Custom Content */}
        {customContent ? (
          <Stack.Item>
            {customContent}
          </Stack.Item>
        ) : tasks.length === 1 ? (
          // Single task - use button pattern
          <Stack.Item>
            <Button
              appearance="primary"
              size="large"
              icon={tasks[0].icon && (
                React.isValidElement(tasks[0].icon) 
                  ? tasks[0].icon 
                  : (tasks[0].icon as { children: React.ReactElement })?.children
              )}
              onClick={tasks[0].onClick}
            >
              {tasks[0].label}
            </Button>
          </Stack.Item>
        ) : tasks.length > 1 ? (
          // Multiple tasks - use tile card layout
          <div className="default-view-inner-container" role="list">
            {tasks.map((task, index) => (
              <div 
                key={task.id}
                className="tile-card-body"
                id={`${task.id}-tile-card`}
                data-testid={`${task.id}-tile-card`}
                aria-label={task.description || task.label}
                tabIndex={0}
                role="listitem"
                onClick={task.onClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    task.onClick();
                  }
                }}
              >
                {/* Icon section with green highlight background */}
                <div className="tile-card-children">
                  {task.icon && (
                    React.isValidElement(task.icon) 
                      ? task.icon 
                      : (task.icon as { children: React.ReactElement })?.children
                  )}
                </div>
                
                {/* Content section */}
                <div className="tile-card-content">
                  <div className="tile-card-title">
                    {task.label}
                  </div>
                  {task.description && (
                    <div className="tile-card-description">
                      {task.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Stack>
    </Stack>
  );

  // Use ItemEditorView with empty state in the center
  return (
    <ItemEditorDefaultView
      center={{
        content: emptyStateContent
      }}
    />
  );
}

export default ItemEditorEmptyView;