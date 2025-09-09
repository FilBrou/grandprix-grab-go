import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderId: string;
  userEmail: string;
  userName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  totalAmount: number;
  collectionPoint: string;
  language: 'fr' | 'en';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      orderId,
      userEmail,
      userName,
      orderNumber,
      items,
      totalAmount,
      collectionPoint,
      language = 'fr'
    }: OrderConfirmationRequest = await req.json();

    console.log('Sending order confirmation for order:', orderNumber);

    // Prepare email content based on language
    const emailContent = {
      fr: {
        subject: `Confirmation de commande #${orderNumber} - Grand Prix Montréal`,
        greeting: `Bonjour ${userName},`,
        confirmationText: "Votre commande a été confirmée avec succès !",
        orderDetailsTitle: "Détails de votre commande :",
        orderNumber: `Numéro de commande : #${orderNumber}`,
        itemsTitle: "Articles commandés :",
        totalLabel: "Total :",
        collectionPointLabel: "Point de collecte :",
        nextStepsTitle: "Prochaines étapes :",
        nextSteps: [
          "Votre commande est en cours de préparation",
          "Vous recevrez une notification lorsqu'elle sera prête",
          "Présentez-vous au point de collecte avec ce numéro de commande"
        ],
        thankYou: "Merci de votre confiance !",
        signature: "L'équipe du Grand Prix de Montréal"
      },
      en: {
        subject: `Order Confirmation #${orderNumber} - Montreal Grand Prix`,
        greeting: `Hello ${userName},`,
        confirmationText: "Your order has been confirmed successfully!",
        orderDetailsTitle: "Order details:",
        orderNumber: `Order number: #${orderNumber}`,
        itemsTitle: "Ordered items:",
        totalLabel: "Total:",
        collectionPointLabel: "Collection point:",
        nextStepsTitle: "Next steps:",
        nextSteps: [
          "Your order is being prepared",
          "You will receive a notification when it's ready",
          "Present yourself at the collection point with this order number"
        ],
        thankYou: "Thank you for your trust!",
        signature: "The Montreal Grand Prix Team"
      }
    };

    const content = emailContent[language];

    // Generate items list HTML
    const itemsHtml = items.map(item => 
      `<li>${item.quantity}x ${item.name} - $${(item.quantity * item.unit_price).toFixed(2)}</li>`
    ).join('');

    const nextStepsHtml = content.nextSteps.map(step => 
      `<li>${step}</li>`
    ).join('');

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${content.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Grand Prix Montréal</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${content.confirmationText}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">${content.greeting}</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
              <h2 style="color: #dc2626; margin-top: 0;">${content.orderDetailsTitle}</h2>
              <p><strong>${content.orderNumber}</strong></p>
              <p><strong>${content.collectionPointLabel}</strong> ${collectionPoint}</p>
              <p><strong>${content.totalLabel}</strong> $${totalAmount.toFixed(2)}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">${content.itemsTitle}</h3>
              <ul style="list-style-type: none; padding: 0;">
                ${itemsHtml}
              </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">${content.nextStepsTitle}</h3>
              <ol>
                ${nextStepsHtml}
              </ol>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <strong>${content.thankYou}</strong><br>
              ${content.signature}
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Grand Prix Montréal <noreply@lovable.app>",
      to: [userEmail],
      subject: content.subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create a notification in the database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        order_id: orderId,
        type: 'order_confirmed',
        title: language === 'fr' ? 'Commande confirmée' : 'Order confirmed',
        message: language === 'fr' 
          ? `Votre commande #${orderNumber} a été confirmée et est en préparation.`
          : `Your order #${orderNumber} has been confirmed and is being prepared.`
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Order confirmation sent successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);