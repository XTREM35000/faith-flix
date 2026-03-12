export interface CinetPayConfig {
  apikey: string
  site_id: string
}

export interface CinetPayPaymentRequest {
  apikey: string
  site_id: string
  transaction_id: string
  amount: number
  currency: "XOF" | "XAF" | "CDF" | "GNF"
  description: string
  notify_url: string
  return_url: string
  channels: "ALL" | "MOBILE_MONEY" | "CARD"
  customer_name?: string
  customer_email?: string
  customer_phone?: string
}

export interface CinetPayPaymentResponse {
  code: string
  message: string
  data?: {
    payment_url: string
    transaction_id: string
    payment_token: string
  }
  description?: string
}

export interface CinetPayWebhookPayload {
  transaction_id: string
  amount: string
  currency: string
  status: "ACCEPTED" | "SUCCESSFUL" | "FAILED" | "CANCELLED"
  payment_method: string
  operator: string
  customer_phone: string
  payment_date: string
}