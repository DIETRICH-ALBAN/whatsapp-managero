export interface Message {
    id: string
    created_at: string
    contact_name: string | null
    contact_phone: string
    content: string
    direction: 'inbound' | 'outbound'
    status: 'new' | 'read' | 'replied' | 'archived' | 'ai_handled'
    platform: string
    is_ai_generated: boolean
    user_id?: string
}

export interface Order {
    id: string
    created_at: string
    customer_name: string
    customer_phone: string | null
    total_amount: number
    currency: string
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
    items: any[]
    user_id?: string
}

export interface Product {
    id: string
    created_at: string
    name: string
    description: string | null
    price: number
    stock_quantity: number
    image_url: string | null
    user_id?: string
}
