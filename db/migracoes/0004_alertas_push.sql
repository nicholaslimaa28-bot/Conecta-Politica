CREATE TABLE "inscricao" (
	"id" serial PRIMARY KEY NOT NULL,
	"assinatura_id" integer NOT NULL,
	"alvo_tipo" text NOT NULL,
	"alvo_id" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificacao" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"assinatura_id" integer NOT NULL,
	"mudanca_id" integer NOT NULL,
	"enviado_em" timestamp with time zone,
	"erro" text
);
--> statement-breakpoint
CREATE TABLE "push_assinatura" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_envio" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "mudanca" ADD COLUMN "processado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_assinatura_id_push_assinatura_id_fk" FOREIGN KEY ("assinatura_id") REFERENCES "public"."push_assinatura"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_assinatura_id_push_assinatura_id_fk" FOREIGN KEY ("assinatura_id") REFERENCES "public"."push_assinatura"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inscricao_uq" ON "inscricao" USING btree ("assinatura_id","alvo_tipo","alvo_id");--> statement-breakpoint
CREATE INDEX "inscricao_alvo_idx" ON "inscricao" USING btree ("alvo_tipo","alvo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notificacao_uq" ON "notificacao" USING btree ("assinatura_id","mudanca_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_endpoint_uq" ON "push_assinatura" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "mudanca_pendente_idx" ON "mudanca" USING btree ("processado_em");