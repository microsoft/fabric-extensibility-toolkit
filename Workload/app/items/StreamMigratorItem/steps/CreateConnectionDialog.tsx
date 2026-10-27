import React, { useEffect, useMemo, useState } from "react";
import {
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Spinner,
  Text
} from "@fluentui/react-components";

import { DialogControl } from "../../../components/Dialog";
import { ConnectionClient } from "../../../clients/ConnectionClient";
import {
  Connection,
  ConnectionCreationMetadata,
  ConnectionCreationParameter
} from "../../../clients/FabricPlatformTypes";
import { AsaInput } from "../../../clients/AzureResourceManagerTypes";
import { pickDefaultConnectionType, prefillConnectionParameter } from "../migration";

/** Credential fields to render per credential type, keyed by Fabric's CredentialType. */
const CREDENTIAL_FIELDS: Record<string, { name: string; label: string; secret: boolean }[]> = {
  Key: [{ name: "key", label: "Key", secret: true }],
  SharedAccessSignature: [{ name: "token", label: "SAS token", secret: true }],
  Basic: [
    { name: "username", label: "Username", secret: false },
    { name: "password", label: "Password", secret: true }
  ],
  ServicePrincipal: [
    { name: "tenantId", label: "Tenant ID", secret: false },
    { name: "servicePrincipalClientId", label: "Client ID", secret: false },
    { name: "servicePrincipalSecret", label: "Client secret", secret: true }
  ],
  Anonymous: [],
  WorkspaceIdentity: []
};

export interface CreateConnectionDialogProps {
  connectionClient: ConnectionClient;
  /** The Eventstream source type, used only to preselect a default. */
  eventstreamSourceType: string;
  /** The ASA input this connection is for, used to prefill non-secret values. */
  asaInput?: AsaInput;
  suggestedDisplayName: string;
  onCreated: (connection: Connection) => void;
  onCancel: () => void;
}

/**
 * Creates a Fabric connection for one Eventstream source.
 *
 * The form is built from what the service reports for the chosen connection type
 * rather than from a hardcoded shape, because parameter names and accepted
 * credential types vary per connector and change over time. Everything ASA can
 * supply is prefilled; only the secret has to be typed.
 */
export function CreateConnectionDialog({
  connectionClient,
  eventstreamSourceType,
  asaInput,
  suggestedDisplayName,
  onCreated,
  onCancel
}: CreateConnectionDialogProps) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [supported, setSupported] = useState<ConnectionCreationMetadata[]>([]);

  const [displayName, setDisplayName] = useState(suggestedDisplayName);
  const [connectionType, setConnectionType] = useState<string>("");
  const [creationMethodName, setCreationMethodName] = useState<string>("");
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [credentialType, setCredentialType] = useState<string>("");
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});

  const selectedType = useMemo(
    () => supported.find(entry => entry.type === connectionType),
    [supported, connectionType]
  );

  const selectedMethod = useMemo(
    () => (selectedType?.creationMethods || []).find(m => m.name === creationMethodName),
    [selectedType, creationMethodName]
  );

  const parameters: ConnectionCreationParameter[] = selectedMethod?.parameters || [];
  const credentialFields = CREDENTIAL_FIELDS[credentialType] || [];

  // Load what this tenant actually supports.
  useEffect(() => {
    let cancelled = false;

    connectionClient
      .getAllSupportedConnectionTypes()
      .then(types => {
        if (cancelled) {
          return;
        }
        setSupported(types);
        const preselected = pickDefaultConnectionType(
          eventstreamSourceType,
          types.map(t => t.type)
        );
        if (preselected) {
          setConnectionType(preselected);
        }
      })
      .catch(caught => {
        console.error("Failed to list supported connection types:", caught);
        if (!cancelled) {
          setError(caught?.message || String(caught));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectionClient, eventstreamSourceType]);

  // When the type changes, adopt its first creation method and credential type,
  // and prefill every parameter the method declares from the ASA input.
  useEffect(() => {
    if (!selectedType) {
      return;
    }

    const firstMethod = (selectedType.creationMethods || [])[0];
    setCreationMethodName(firstMethod?.name || "");

    const prefilled: Record<string, string> = {};
    for (const parameter of firstMethod?.parameters || []) {
      prefilled[parameter.name] = prefillConnectionParameter(parameter.name, asaInput);
    }
    setParameterValues(prefilled);

    const credentialTypes = selectedType.supportedCredentialTypes || [];
    const preferred = ["Key", "SharedAccessSignature", "ServicePrincipal", "Basic"].find(
      candidate => credentialTypes.indexOf(candidate) !== -1
    );
    setCredentialType(preferred || credentialTypes[0] || "");
    setCredentialValues({});
  }, [selectedType, asaInput]);

  const missingRequired = parameters
    .filter(p => p.required && !(parameterValues[p.name] || "").trim())
    .map(p => p.name);

  const missingCredentials = credentialFields
    .filter(f => !(credentialValues[f.name] || "").trim())
    .map(f => f.label);

  const canCreate =
    !creating &&
    Boolean(displayName.trim()) &&
    Boolean(connectionType) &&
    Boolean(creationMethodName) &&
    missingRequired.length === 0 &&
    missingCredentials.length === 0;

  async function create(): Promise<void> {
    setCreating(true);
    setError("");

    try {
      const credentials: { credentialType: string; [key: string]: any } = { credentialType };
      for (const field of credentialFields) {
        credentials[field.name] = credentialValues[field.name];
      }

      const connection = await connectionClient.createCloudConnection({
        displayName: displayName.trim(),
        connectivityType: "ShareableCloud",
        connectionDetails: {
          type: connectionType,
          creationMethod: creationMethodName,
          parameters: parameters
            .filter(p => (parameterValues[p.name] || "").trim())
            .map(p => ({
              name: p.name,
              dataType: p.dataType || "Text",
              value: parameterValues[p.name]
            }))
        },
        privacyLevel: "Organizational",
        credentialDetails: {
          singleSignOnType: "None",
          connectionEncryption: "NotEncrypted",
          skipTestConnection: false,
          credentials
        }
      });

      onCreated(connection);
    } catch (caught) {
      // Fabric's own message names the offending parameter, so surface it as-is.
      console.error("Connection creation failed:", caught);
      setError(caught?.message || String(caught));
    } finally {
      setCreating(false);
    }
  }

  return (
    <DialogControl
      title="Create a Fabric connection"
      confirmLabel={creating ? "Creating..." : "Create"}
      cancelLabel="Cancel"
      isConfirmDisabled={!canCreate}
      onConfirm={create}
      onCancel={onCancel}
      minWidth={560}
    >
      {loading ? (
        <Spinner size="tiny" label="Loading supported connection types..." />
      ) : (
        <div className="stream-migrator__step">
          <Text as="p">
            Values carried over from the Stream Analytics job are prefilled. Azure never
            returns the job's secret, so the credential has to be entered here.
          </Text>

          <Field label="Connection name" className="stream-migrator__field" required>
            <Input value={displayName} onChange={(_, d) => setDisplayName(d.value)} />
          </Field>

          <Field
            label="Connection type"
            className="stream-migrator__field"
            required
            hint={
              connectionType
                ? undefined
                : "No type matched this source automatically - choose the one that fits."
            }
          >
            <Dropdown
              placeholder="Select a connection type"
              value={connectionType}
              selectedOptions={connectionType ? [connectionType] : []}
              onOptionSelect={(_, d) => setConnectionType(d.optionValue)}
            >
              {supported.map(entry => (
                <Option key={entry.type} value={entry.type} text={entry.type}>
                  {entry.type}
                </Option>
              ))}
            </Dropdown>
          </Field>

          {(selectedType?.creationMethods || []).length > 1 && (
            <Field label="Creation method" className="stream-migrator__field" required>
              <Dropdown
                value={creationMethodName}
                selectedOptions={creationMethodName ? [creationMethodName] : []}
                onOptionSelect={(_, d) => setCreationMethodName(d.optionValue)}
              >
                {(selectedType?.creationMethods || []).map(method => (
                  <Option key={method.name} value={method.name} text={method.name}>
                    {method.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          )}

          {parameters.map(parameter => (
            <Field
              key={parameter.name}
              label={parameter.name}
              className="stream-migrator__field"
              required={parameter.required}
            >
              {parameter.allowedValues?.length ? (
                <Dropdown
                  value={parameterValues[parameter.name] || ""}
                  selectedOptions={
                    parameterValues[parameter.name] ? [parameterValues[parameter.name]] : []
                  }
                  onOptionSelect={(_, d) =>
                    setParameterValues(prev => ({ ...prev, [parameter.name]: d.optionValue }))
                  }
                >
                  {parameter.allowedValues.map(value => (
                    <Option key={value} value={value} text={value}>
                      {value}
                    </Option>
                  ))}
                </Dropdown>
              ) : (
                <Input
                  value={parameterValues[parameter.name] || ""}
                  onChange={(_, d) =>
                    setParameterValues(prev => ({ ...prev, [parameter.name]: d.value }))
                  }
                />
              )}
            </Field>
          ))}

          {(selectedType?.supportedCredentialTypes || []).length > 0 && (
            <Field label="Authentication" className="stream-migrator__field" required>
              <Dropdown
                value={credentialType}
                selectedOptions={credentialType ? [credentialType] : []}
                onOptionSelect={(_, d) => {
                  setCredentialType(d.optionValue);
                  setCredentialValues({});
                }}
              >
                {(selectedType?.supportedCredentialTypes || []).map(type => (
                  <Option key={type} value={type} text={type}>
                    {type}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          )}

          {credentialFields.map(field => (
            <Field
              key={field.name}
              label={field.label}
              className="stream-migrator__field"
              required
            >
              <Input
                type={field.secret ? "password" : "text"}
                value={credentialValues[field.name] || ""}
                onChange={(_, d) =>
                  setCredentialValues(prev => ({ ...prev, [field.name]: d.value }))
                }
              />
            </Field>
          ))}

          {credentialType && !CREDENTIAL_FIELDS[credentialType] && (
            <MessageBar intent="warning">
              <MessageBarBody>
                <MessageBarTitle>Unsupported authentication type</MessageBarTitle>
                {`This tool does not yet collect credentials for '${credentialType}'. ` +
                  "Pick another type, or create this connection in Fabric directly."}
              </MessageBarBody>
            </MessageBar>
          )}

          {error && (
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Could not create the connection</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          )}
        </div>
      )}
    </DialogControl>
  );
}
