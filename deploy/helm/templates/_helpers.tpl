{{- define "barber-front.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "barber-front.fullname" -}}
{{- include "barber-front.name" . }}
{{- end }}

{{- define "barber-front.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ include "barber-front.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/part-of: barber
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "barber-front.selectorLabels" -}}
app.kubernetes.io/name: {{ include "barber-front.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
