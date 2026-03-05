import React from "react";
import { Button, Text } from "@fluentui/react-components";
import "./Dialog.scss";

export interface DialogControlProps {
    title: string;
    children: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isConfirmDisabled?: boolean;
    minWidth?: number;
    minHeight?: number;
    style?: React.CSSProperties;
}

export function DialogControl({
    title,
    children,
    onConfirm,
    onCancel,
    confirmLabel = "OK",
    cancelLabel = "Cancel",
    isConfirmDisabled = false,
    minWidth = 400,
    minHeight = 300,
    style
}: DialogControlProps) {
    const containerStyle: React.CSSProperties = {
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        ...style
    };

    return (
        <div 
            className="dialog-control" 
            style={containerStyle}
        >
            {/* Header */}
            <div className="dialog-control__header">
                <Text size={500} weight="semibold" className="dialog-control__title">
                    {title}
                </Text>
            </div>

            {/* Content */}
            <div className="dialog-control__content">
                {children}
            </div>

            {/* Footer */}
            <div className="dialog-control__footer">
                {onCancel && (
                    <Button
                        appearance="secondary"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </Button>
                )}
                {onConfirm && (
                    <Button
                        appearance="primary"
                        onClick={onConfirm}
                        disabled={isConfirmDisabled}
                    >
                        {confirmLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
