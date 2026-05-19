import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as opentelemetry from '@opentelemetry/api';

@Injectable()
export class TracingService implements OnModuleInit {
  private readonly logger = new Logger(TracingService.name);
  private tracer: opentelemetry.Tracer | null = null;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const otelEndpoint = this.configService.get<string>('OTEL_EXPORTER_OTLP_ENDPOINT');
    this.enabled = !!otelEndpoint;

    if (this.enabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { NodeSDK } = require('@opentelemetry/sdk-node');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');

        const sdk = new NodeSDK({
          traceExporter: new OTLPTraceExporter({
            url: otelEndpoint,
          }),
          instrumentations: [getNodeAutoInstrumentations()],
          serviceName: 'alcestis-reporting',
        });

        sdk.start();
        this.tracer = opentelemetry.trace.getTracer('alcestis-reporting');
        this.logger.log(`OpenTelemetry tracing enabled — exporting to ${otelEndpoint}`);
      } catch (error) {
        this.logger.warn('Failed to initialize OpenTelemetry SDK, tracing disabled', error.message);
        this.enabled = false;
      }
    } else {
      this.logger.log('OpenTelemetry tracing disabled — set OTEL_EXPORTER_OTLP_ENDPOINT to enable');
    }
  }

  public startSpan(name: string, attributes?: Record<string, string>): opentelemetry.Span | null {
    if (!this.enabled || !this.tracer) return null;
    const span = this.tracer.startSpan(name);
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }
    return span;
  }

  public endSpan(span: opentelemetry.Span | null): void {
    if (span) span.end();
  }
}
