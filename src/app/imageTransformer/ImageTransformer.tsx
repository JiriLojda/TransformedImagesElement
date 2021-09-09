import React, { FC, lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { Router } from '@reach/router';

import { loadModule } from '../../utilities/modules';
import { kenticoKontent } from '../appSettings.json';
import { ErrorBoundary } from '../ErrorBoundary';
import { Loading } from '../Loading';
import {
    CustomElementContext,
    defaultCustomElementContext,
    ICustomElementContext
} from './CustomElementContext';
import { IContext } from './shared/IContext';
import { ICustomElement } from './shared/ICustomElement';
import { ITransformedImage, TransformedImage } from './shared/TransformedImage';

const Listing = lazy(() => import('./listing/Listing').then(module => ({ default: module.Listing })));
const Editor = lazy(() => import('./editor/Editor').then(module => ({ default: module.Editor })));

// Expose access to Kentico custom element API
declare const CustomElement: ICustomElement;

export const ImageTransformer: FC = () => {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ITransformedImage[]>([]);
  const [context, setContext] = useState<ICustomElementContext>(defaultCustomElementContext);

  const update = useCallback(() => {
    if (available && enabled) {
      CustomElement.setValue(JSON.stringify(selectedImages.map(selectedImage => selectedImage.getDeliveryModel())));
    }
  }, [available, enabled, selectedImages]);

  useEffect(() => {
    const initCustomElement = async (element: ICustomElement, itemContext: IContext) => {
      if (element.config !== null) {
        setContext(Object.assign(context, element.config));
      }

      setContext(context => {
        context.itemContext = itemContext;
        return context;
      });

      const oldImages = JSON.parse(element.value || JSON.stringify([])) as ITransformedImage[];

      const selectedImages: ITransformedImage[] = [];

      if (oldImages.length > 0) {
        const newImages = await CustomElement.getAssetDetails(oldImages.map(oldImage => oldImage.id));

        for (const oldImage of oldImages) {
          const newImage = newImages.find(newImage => newImage.id === oldImage.id);

          if (newImage) {
            selectedImages.push(
              new TransformedImage(
                newImage,
                TransformedImage.getDescription(newImage, itemContext),
                context,
                oldImage.transforms
              )
            );
          }
        }
      }

      setAvailable(true);
      setEnabled(!element.disabled);
      setSelectedImages(selectedImages);

      CustomElement.onDisabledChanged(disabled => setEnabled(!disabled));
    };

    loadModule(kenticoKontent.customElementScriptEndpoint, () => CustomElement.init(initCustomElement));
  }, [context]);

  useEffect(() => {
    update();
  });

  const customElementContext: ICustomElementContext = {
    ...context,
    enabled,
    selectedImages,
    setSelectedImages,
    update
  };
  const RouterWorkaround = Router as any;

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary>
        <CustomElementContext.Provider value={customElementContext}>
          {!available && <Loading />}
          {available && (
            <RouterWorkaround>
              <Listing default path='/' />
              <Editor path='/:index/:id' />
            </RouterWorkaround>
          )}
        </CustomElementContext.Provider>
      </ErrorBoundary>
    </Suspense>
  );
};
