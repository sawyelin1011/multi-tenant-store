CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"permissions" text DEFAULT '[]',
	"tenant_id" uuid,
	"user_id" uuid,
	"expires_at" text,
	"last_used_at" text,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid,
	"order_item_id" text,
	"delivery_method_id" uuid,
	"status" text DEFAULT 'pending',
	"delivery_data" text DEFAULT '{}',
	"attempts" integer DEFAULT 0,
	"delivered_at" text,
	"error_log" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "delivery_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"config" text DEFAULT '{}',
	"template" text DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "field_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"component" text,
	"validation_schema" text DEFAULT '{}',
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "field_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "integration_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" text NOT NULL,
	"sync_type" text,
	"status" text DEFAULT 'pending',
	"synced_data" text DEFAULT '{}',
	"errors" text DEFAULT '{}',
	"started_at" text,
	"completed_at" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"integration_type" text,
	"credentials" text,
	"field_mapping" text DEFAULT '{}',
	"sync_config" text DEFAULT '{}',
	"webhook_config" text DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" text,
	"quantity" integer,
	"unit_price" real,
	"item_data" text DEFAULT '{}',
	"delivery_status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"order_number" text,
	"status" text DEFAULT 'pending',
	"items_data" text DEFAULT '{}',
	"pricing_data" text DEFAULT '{}',
	"payment_data" text DEFAULT '{}',
	"customer_data" text DEFAULT '{}',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_orders_tenant_number" UNIQUE("tenant_id","order_number")
);
--> statement-breakpoint
CREATE TABLE "payment_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"gateway_type" text,
	"credentials" text,
	"config" text DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid,
	"gateway_id" uuid,
	"transaction_id" text,
	"amount" real,
	"status" text,
	"gateway_response" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plugin_hooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" uuid NOT NULL,
	"hook_name" text NOT NULL,
	"handler_function" text,
	"priority" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plugins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"version" text,
	"author" text,
	"description" text,
	"manifest" text DEFAULT '{}',
	"status" text DEFAULT 'available',
	"is_official" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "plugins_name_unique" UNIQUE("name"),
	CONSTRAINT "plugins_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"rule_type" text,
	"conditions" text DEFAULT '{}',
	"price_modifier" text DEFAULT '{}',
	"priority" integer DEFAULT 100,
	"active_from" text,
	"active_until" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"attribute_key" text NOT NULL,
	"attribute_value" text,
	"attribute_type" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_product_attributes_key" UNIQUE("product_id","attribute_key")
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"category" text,
	"schema" text DEFAULT '{}' NOT NULL,
	"ui_config" text DEFAULT '{}',
	"validation_rules" text DEFAULT '{}',
	"workflows" text DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_product_types_tenant_slug" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"attributes" text DEFAULT '{}',
	"price_data" text DEFAULT '{}',
	"inventory_data" text DEFAULT '{}',
	"delivery_data" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_type_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"status" text DEFAULT 'draft',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_products_tenant_slug" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"version" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"executed_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "tenant_plugins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plugin_id" uuid NOT NULL,
	"status" text DEFAULT 'inactive',
	"config" text DEFAULT '{}',
	"installed_at" text DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_tenant_plugin" UNIQUE("tenant_id","plugin_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"permissions" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"subdomain" text,
	"status" text DEFAULT 'active',
	"plan" text DEFAULT 'basic',
	"settings" text DEFAULT '{}',
	"branding" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ui_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"plugin_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"is_system" boolean DEFAULT false,
	"props_schema" text DEFAULT '{}',
	"default_props" text DEFAULT '{}',
	"render_config" text DEFAULT '{}',
	"dependencies" text DEFAULT '[]',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_ui_components_tenant_slug" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "ui_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"plugin_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'page',
	"is_system" boolean DEFAULT false,
	"grid_config" text DEFAULT '{}',
	"regions" text DEFAULT '[]',
	"responsive_config" text DEFAULT '{}',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_ui_layouts_tenant_slug" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "ui_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"plugin_id" uuid,
	"page" text NOT NULL,
	"name" text NOT NULL,
	"layout_id" uuid,
	"theme_id" uuid,
	"is_default" boolean DEFAULT false,
	"is_system" boolean DEFAULT false,
	"override_config" text DEFAULT '{}',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_ui_templates_tenant_page" UNIQUE("tenant_id","page")
);
--> statement-breakpoint
CREATE TABLE "ui_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_system" boolean DEFAULT false,
	"colors" text DEFAULT '{}',
	"fonts" text DEFAULT '{}',
	"spacing" text DEFAULT '{}',
	"borders" text DEFAULT '{}',
	"shadows" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_ui_themes_tenant_slug" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "ui_widgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"component_id" text NOT NULL,
	"page" text NOT NULL,
	"region" text NOT NULL,
	"position" integer DEFAULT 0,
	"props" text DEFAULT '{}',
	"visibility_rules" text DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"permissions" text DEFAULT '{}',
	"pricing_tier" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_user_roles_tenant_slug" UNIQUE("tenant_id","slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user',
	"api_key" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" text NOT NULL,
	"entity_id" text,
	"status" text DEFAULT 'pending',
	"current_step" integer,
	"execution_data" text DEFAULT '{}',
	"started_at" text,
	"completed_at" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"entity_type" text,
	"trigger" text,
	"steps" text DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD CONSTRAINT "delivery_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_syncs" ADD CONSTRAINT "integration_syncs_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_gateways" ADD CONSTRAINT "payment_gateways_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_gateway_id_payment_gateways_id_fk" FOREIGN KEY ("gateway_id") REFERENCES "public"."payment_gateways"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_hooks" ADD CONSTRAINT "plugin_hooks_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plugins" ADD CONSTRAINT "tenant_plugins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plugins" ADD CONSTRAINT "tenant_plugins_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_components" ADD CONSTRAINT "ui_components_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_components" ADD CONSTRAINT "ui_components_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_layouts" ADD CONSTRAINT "ui_layouts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_layouts" ADD CONSTRAINT "ui_layouts_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_templates" ADD CONSTRAINT "ui_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_templates" ADD CONSTRAINT "ui_templates_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_templates" ADD CONSTRAINT "ui_templates_layout_id_ui_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."ui_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_templates" ADD CONSTRAINT "ui_templates_theme_id_ui_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."ui_themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_themes" ADD CONSTRAINT "ui_themes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_widgets" ADD CONSTRAINT "ui_widgets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_widgets" ADD CONSTRAINT "ui_widgets_component_id_ui_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."ui_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_keys_key_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_api_keys_tenant_id" ON "api_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_user_id" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_deliveries_tenant_id" ON "deliveries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_deliveries_order_id" ON "deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_methods_tenant_id" ON "delivery_methods" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_integration_syncs_integration_id" ON "integration_syncs" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_integrations_tenant_id" ON "integrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_id" ON "orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_gateways_tenant_id" ON "payment_gateways" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_tenant_id" ON "payment_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_order_id" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_hooks_plugin_id" ON "plugin_hooks" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_rules_tenant_id" ON "pricing_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_attributes_product_id" ON "product_attributes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_types_tenant_id" ON "product_types" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_variants_product_id" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_products_tenant_id" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_products_product_type_id" ON "products" USING btree ("product_type_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_plugins_tenant_id" ON "tenant_plugins" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_users_tenant_id" ON "tenant_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_users_user_id" ON "tenant_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tenants_slug" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tenants_domain" ON "tenants" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ui_components_tenant_id" ON "ui_components" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ui_components_plugin_id" ON "ui_components" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_ui_components_slug" ON "ui_components" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_ui_components_type" ON "ui_components" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_ui_components_category" ON "ui_components" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ui_layouts_tenant_id" ON "ui_layouts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ui_layouts_plugin_id" ON "ui_layouts" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_ui_layouts_slug" ON "ui_layouts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_ui_layouts_type" ON "ui_layouts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_ui_templates_tenant_id" ON "ui_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ui_templates_plugin_id" ON "ui_templates" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_ui_templates_page" ON "ui_templates" USING btree ("page");--> statement-breakpoint
CREATE INDEX "idx_ui_templates_layout_id" ON "ui_templates" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "idx_ui_templates_theme_id" ON "ui_templates" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "idx_ui_themes_tenant_id" ON "ui_themes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ui_themes_slug" ON "ui_themes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_ui_widgets_tenant_id" ON "ui_widgets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ui_widgets_component_id" ON "ui_widgets" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_ui_widgets_page" ON "ui_widgets" USING btree ("page");--> statement-breakpoint
CREATE INDEX "idx_ui_widgets_page_region" ON "ui_widgets" USING btree ("page","region");--> statement-breakpoint
CREATE INDEX "idx_user_roles_tenant_id" ON "user_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_api_key" ON "users" USING btree ("api_key");--> statement-breakpoint
CREATE INDEX "idx_workflow_executions_workflow_id" ON "workflow_executions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_executions_status" ON "workflow_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_workflows_tenant_id" ON "workflows" USING btree ("tenant_id");