﻿import * as React from "react";

import { BaseControls } from "./controls/BaseControls";

import { ResizeControls, IResizeControlsProps } from "./controls/ResizeControls";
import { BackgroundControls, IBackgroundControlsProps } from "./controls/BackgroundControls";
import { TransformedImage } from "../../types/transformedImage/TransformedImage";
import { Checkerboard } from "../../types/editor/Checkerboard";
import { CropControls, ICropControlsProps } from "./controls/CropControls";
import { CropType, ResizeType } from "../../types/transformedImage/IImageTransformations";

export enum EditorMode {
    preview,
    hovering,
    noPreview
}

export interface IImageEditorProps {
    editedImage: TransformedImage;
    isPreview: () => boolean;
}

export interface IImageEditorState {
    currentEditor: BaseControls;
    mode: EditorMode;
}

export class TransformationsEditor extends React.Component<IImageEditorProps, IImageEditorState> {
    state: IImageEditorState = {
        currentEditor: null,
        mode: this.getMode()
    }

    getMode(): EditorMode {
        return this.props.isPreview()
            ? this.state
                ? this.state.mode
                : EditorMode.preview
            : EditorMode.noPreview;
    }

    setMode = (mode: EditorMode) => {
        this.setState({ mode: mode })
    }

    getImageUrl(): string {
        switch (this.getMode()) {
            case EditorMode.preview:
                return this.props.editedImage.buildEditedUrl().getUrl();
            case EditorMode.hovering:
                return this.props.editedImage.buildHoverUrl().getUrl();
            case EditorMode.noPreview:
                return this.props.editedImage.buildUrl().getUrl();
        }
    }

    getHoveringClass(): string {
        switch (this.getMode()) {
            case EditorMode.preview:
                return "preview";
            case EditorMode.hovering:
                return "scaleToFit";
            case EditorMode.noPreview:
                return "";
        }
    }

    render() {
        let currentEditor = this.state.currentEditor;
        const transformations = this.props.editedImage.transformations;

        return (
            <div
                className="editor"
                style={{
                    background: `url(${Checkerboard.generate("transparent", "rgba(0,0,0,.02)", 16)}) center left`
                }}
            >
                <div
                    className={`imageEditorPreview ${this.getHoveringClass()}`}
                    onMouseEnter={() => this.setMode(EditorMode.hovering)}
                    onMouseLeave={() => this.setMode(EditorMode.preview)}
                >
                    <span className="imageWrapper">
                        <div
                            className="imageMask"
                            onMouseDown={e => {
                                if (this.state.currentEditor.onMouseDown(e))
                                    this.forceUpdate()
                            }}
                            onMouseMove={e => {
                                if (this.state.currentEditor.onMouseMove(e))
                                    this.forceUpdate()
                            }}
                            onMouseUp={e => {
                                if (this.state.currentEditor.onMouseUp(e))
                                    this.forceUpdate()
                            }}
                        >
                            {this.state.currentEditor
                                ? this.state.currentEditor.getImageOverlay()
                                : null
                            }
                        </div>
                        <img
                            className="imageEditorImage"
                            src={this.getImageUrl()}
                        />
                    </span>
                </div>
                <div
                    className="editorControls"
                    onClick={e => {
                        this.state.currentEditor.onClickSidebar();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                    }}
                >
                    <CropControls
                        getCurrentEditor={currentEditor as BaseControls<ICropControlsProps>}
                        setCurrentEditor={editor => {
                            currentEditor = editor;
                            this.setState({ currentEditor: editor })
                        }}
                        getTransformation={transformations.crop}
                        onSetTransformation={() => this.forceUpdate()}
                        imageWidth={this.props.editedImage.imageWidth}
                        imageHeight={this.props.editedImage.imageHeight}
                    />
                    <ResizeControls
                        getCurrentEditor={currentEditor as BaseControls<IResizeControlsProps>}
                        setCurrentEditor={editor => {
                            this.setState({ currentEditor: editor })
                        }}
                        getTransformation={transformations.resize}
                        onSetTransformation={() => this.forceUpdate()}
                        imageWidth={this.props.editedImage.imageWidth}
                        imageHeight={this.props.editedImage.imageHeight}
                        justCrop={transformations.crop.type !== CropType.full}
                    />
                    <BackgroundControls
                        getCurrentEditor={currentEditor as BaseControls<IBackgroundControlsProps>}
                        setCurrentEditor={editor => {
                            this.setState({ currentEditor: editor })
                        }}
                        getTransformation={transformations.background}
                        onSetTransformation={() => this.forceUpdate()}
                    />
                </div>
            </div >
        );
    }
}