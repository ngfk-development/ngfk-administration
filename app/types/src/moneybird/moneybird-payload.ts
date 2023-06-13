export interface MoneybirdPayload {
  action: string;
  administration_id: string;
  entity_id: string;
  entity_type: string;
  entity: any;
  state: string;
  webhook_id: string;
  webhook_token: string;
}
