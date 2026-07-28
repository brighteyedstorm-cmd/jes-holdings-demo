import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { SPComponentLoader } from '@microsoft/sp-loader';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'EventsHubWebPartStrings';
import { EventsHub, IEventsHubProps } from './components/EventsHub';

export interface IEventsHubWebPartProps {
  title: string;
}

/** Display type. The body and interface stack stays the system one. */
const LORA = 'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap';

export default class EventsHubWebPart extends BaseClientSideWebPart<IEventsHubWebPartProps> {

  protected onInit(): Promise<void> {
    SPComponentLoader.loadCss(LORA);
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IEventsHubProps> = React.createElement(EventsHub, {
      context: this.context
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: strings.TitleFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
