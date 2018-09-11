/**
 * @license
 * Copyright 2018 JBoss Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, ViewEncapsulation} from "@angular/core";
import {Oas20SecurityScheme, Oas30OAuthFlow, Oas30SecurityScheme, OasDocument, OasSecurityScheme} from "oai-ts-core";
import {ObjectUtils} from "../../_util/object.util";
import {EntityEditor, EntityEditorEvent, IEntityEditorHandler} from "./entity-editor.component";

export interface Scope {
    name: string;
    description: string;
}

export interface Flow {
    enabled: boolean;
    authorizationUrl: string;
    tokenUrl: string;
    refreshUrl: string;
    scopes: Scope[];
}

export interface Flows {
    implicit: Flow;
    password: Flow;
    clientCredentials: Flow;
    authorizationCode: Flow;
}

export interface SecuritySchemeData {
    schemeName: string;
    description: string;
    type: string;
    name: string;
    in: string;
    flow: string;
    authorizationUrl: string;
    tokenUrl: string;
    scopes: Scope[]
}

export interface SecurityScheme20Data extends SecuritySchemeData {
    flow: string;
    authorizationUrl: string;
    tokenUrl: string;
    scopes: Scope[]
}

export interface SecurityScheme30Data extends SecuritySchemeData {
    // *http* - Basic, Bearer, Digest
    scheme: string;
    // *http* - JWT, OAuth
    bearerFormat: string;
    // *openIdConnect*
    openIdConnectUrl: string;
    // *oauth2* - implicit, password, clientCredentials, authorizationCode
    flows: Flows;
}

export interface SecuritySchemeEditorEvent extends EntityEditorEvent<OasSecurityScheme> {
    data: SecurityScheme20Data | SecurityScheme30Data;
}

export interface ISecuritySchemeEditorHandler extends IEntityEditorHandler<OasSecurityScheme, SecuritySchemeEditorEvent> {
    onSave(event: SecuritySchemeEditorEvent): void;
    onCancel(event: SecuritySchemeEditorEvent): void;
}


@Component({
    moduleId: module.id,
    selector: "security-scheme-editor",
    templateUrl: "security-scheme-editor.component.html",
    styleUrls: ["security-scheme-editor.component.css"],
    encapsulation: ViewEncapsulation.None
})
export class SecuritySchemeEditorComponent extends EntityEditor<OasSecurityScheme, SecuritySchemeEditorEvent> {

    public oauthTab: string = "implicit";
    public model: SecuritySchemeData;

    private scopeIncrement: number;

    /**
     * Called to open the editor.
     * @param handler
     * @param context
     * @param server
     */
    public open(handler: ISecuritySchemeEditorHandler, context: OasDocument, scheme?: OasSecurityScheme): void {
        this.scopeIncrement = 1;
        super.open(handler, context, scheme);
    }

    public is2x(): boolean {
        return this.context.ownerDocument().is2xDocument();
    }

    public is3x(): boolean {
        return this.context.ownerDocument().is3xDocument();
    }

    /**
     * Initializes the editor's data model from a provided entity.
     * @param entity
     */
    public initializeModelFromEntity(entity: OasSecurityScheme): void {
        this.initModel(entity);
    }

    /**
     * Initializes the editor's data model to an empty state.
     */
    public initializeModel(): void {
        this.initModel();
    }

    /**
     * Returns true if the data model is valid.
     */
    public isValid(): boolean {
        let hasSchemeName: boolean = !ObjectUtils.isNullOrUndefined(this.model.schemeName);
        let hasType: boolean = !ObjectUtils.isNullOrUndefined(this.model.type);
        return hasSchemeName && hasType;
    }

    /**
     * Creates an entity event specific to this entity editor.
     */
    public entityEvent(): SecuritySchemeEditorEvent {
        let event: SecuritySchemeEditorEvent = {
            entity: this.entity,
            data: this.model
        };
        return event;
    }

    protected initModel(scheme?: OasSecurityScheme): void {
        if (this.context.ownerDocument().is2xDocument()) {
            this.model = {
                schemeName: null,
                description: null,
                type: null,
                name: null,
                in: null,
                flow: null,
                authorizationUrl: null,
                tokenUrl: null,
                scopes: []
            } as SecurityScheme20Data;
        } else {
            this.model = {
                schemeName: null,
                type: null,
                description: null,
                name: null,
                in: null,
                scheme: null,
                bearerFormat: null,
                openIdConnectUrl: null,
                flows: {
                    implicit: {
                        enabled: false,
                        authorizationUrl: null,
                        tokenUrl: null,
                        refreshUrl: null,
                        scopes: []
                    },
                    password: {
                        enabled: false,
                        authorizationUrl: null,
                        tokenUrl: null,
                        refreshUrl: null,
                        scopes: []
                    },
                    clientCredentials: {
                        enabled: false,
                        authorizationUrl: null,
                        tokenUrl: null,
                        refreshUrl: null,
                        scopes: []
                    },
                    authorizationCode: {
                        enabled: false,
                        authorizationUrl: null,
                        tokenUrl: null,
                        refreshUrl: null,
                        scopes: []
                    }
                }
            } as SecurityScheme30Data;
        }

        if (scheme) {
            if (this.context.ownerDocument().is2xDocument()) {
                let scheme20: Oas20SecurityScheme = scheme as Oas20SecurityScheme;
                this.model.schemeName = scheme20.schemeName();
                this.model.description = scheme20.description;
                this.model.type = scheme20.type;
                this.model.in = scheme20.in;
                this.model.name = scheme20.name;
                this.model.flow = scheme20.flow;
                this.model.authorizationUrl = scheme20.authorizationUrl;
                this.model.tokenUrl = scheme20.tokenUrl;
                this.model.scopes = this.toScopesArray(scheme20.scopes);
            } else {
                let scheme30: Oas30SecurityScheme = scheme as Oas30SecurityScheme;
                let model: SecurityScheme30Data = this.model as SecurityScheme30Data;
                model.schemeName = scheme30.schemeName();
                model.description = scheme30.description;
                model.type = scheme30.type;
                model.in = scheme30.in;
                model.name = scheme30.name;
                model.scheme = scheme30.scheme;
                model.bearerFormat = scheme30.bearerFormat;
                model.openIdConnectUrl = scheme30.openIdConnectUrl;
                this.readFlows(scheme30);
                if (!ObjectUtils.isNullOrUndefined(scheme30.flows)) {
                    if (!ObjectUtils.isNullOrUndefined(scheme30.flows.authorizationCode)) {
                        this.oauthTab = "authorizationCode";
                    }
                    if (!ObjectUtils.isNullOrUndefined(scheme30.flows.clientCredentials)) {
                        this.oauthTab = "clientCredentials";
                    }
                    if (!ObjectUtils.isNullOrUndefined(scheme30.flows.password)) {
                        this.oauthTab = "password";
                    }
                    if (!ObjectUtils.isNullOrUndefined(scheme30.flows.implicit)) {
                        this.oauthTab = "implicit";
                    }
                }
            }
        }
    }

    /**
     * Reads the flow information from the security scheme and copies it to the model.
     * @param scheme
     */
    private readFlows(scheme: Oas30SecurityScheme) {
        if (!ObjectUtils.isNullOrUndefined(scheme.flows)) {
            if (!ObjectUtils.isNullOrUndefined(scheme.flows.implicit)) {
                this.readFlowInto(scheme.flows.implicit, (this.model as SecurityScheme30Data).flows.implicit);
            }
            if (!ObjectUtils.isNullOrUndefined(scheme.flows.password)) {
                this.readFlowInto(scheme.flows.password, (this.model as SecurityScheme30Data).flows.password);
            }
            if (!ObjectUtils.isNullOrUndefined(scheme.flows.authorizationCode)) {
                this.readFlowInto(scheme.flows.authorizationCode, (this.model as SecurityScheme30Data).flows.authorizationCode);
            }
            if (!ObjectUtils.isNullOrUndefined(scheme.flows.clientCredentials)) {
                this.readFlowInto(scheme.flows.clientCredentials, (this.model as SecurityScheme30Data).flows.clientCredentials);
            }
        }
    }

    /**
     * Reads flow information from the data model into the local UI model.
     * @param flowModel
     * @param flow
     */
    private readFlowInto(flowModel: Oas30OAuthFlow, flow: Flow) {
        flow.enabled = true;
        flow.authorizationUrl = flowModel.authorizationUrl;
        flow.tokenUrl = flowModel.tokenUrl;
        flow.refreshUrl = flowModel.refreshUrl;
        flow.scopes = this.toScopesArray(flowModel.scopes);
    }

    /**
     * Converts from OAS30 scopes to an array of scope objects.
     * @param scopes
     * @return
     */
    private toScopesArray(scopes: any): Scope[] {
        let rval: Scope[] = [];
        if (scopes) {
            for (let sk in scopes) {
                let sd: string = scopes[sk]
                rval.push({
                    name: sk,
                    description: sd
                });
            }
        }
        return rval;
    }

    /**
     * Sets the flow.
     * @param flow
     */
    public setFlow(flow: string): void {
        this.model.flow = flow;
        if (flow === "implicit") {
            this.model.tokenUrl = null;
        }
        if (flow === "password") {
            this.model.authorizationUrl = null;
        }
        if (flow === "accessCode") {
        }
        if (flow === "application") {
            this.model.authorizationUrl = null;
        }
    }

    /**
     * Called when the user clicks the "Add Scope" button.
     * @param flow
     */
    public addScope(flow?: string): void {
        if (!flow) {
            this.model20().scopes.push({
                name: "scope-" + this.scopeIncrement++,
                description: ""
            });
        } else {
            this.model30().flows[flow].scopes.push({
                name: "scope-" + this.scopeIncrement++,
                description: ""
            });
        }
    }

    /**
     * Called to delete a scope.
     * @param scope
     * @param flow
     */
    public deleteScope(scope: Scope, flow?: string): void {
        if (!flow) {
            this.model20().scopes.splice(this.model.scopes.indexOf(scope), 1);
        } else {
            this.model30().flows[flow].scopes.splice(this.model30().flows[flow].scopes.indexOf(scope), 1);
        }
    }

    /**
     * Returns true only if all the defined scopes are valid (have names).
     * @return
     */
    public scopesAreValid(): boolean {
        if (this.model.type === "oauth2") {
            for (let scope of this.model.scopes) {
                if (ObjectUtils.isNullOrUndefined(scope.name) || scope.name.length === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Sets the type.
     * @param type
     */
    public setType(type: string): void {
        this.model.type = type;
    }

    /**
     * Gets the 2.0 version of the data model.
     */
    public model20(): SecurityScheme20Data {
        return this.model as SecurityScheme20Data;
    }

    /**
     * Gets the 3.0 version of the data model.
     */
    public model30(): SecurityScheme30Data {
        return this.model as SecurityScheme30Data;
    }

}