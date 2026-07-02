import { Router, Request, Response } from 'express';
import express from 'express';
import { getStripeEvent } from '../services/stripe';
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from '../services/stripe';
import Stripe from 'stripe';

const router = Router();

// Middleware para Stripe webhook (raw body)
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const event = await getStripeEvent(req.body, signature);

    if (!event) {
      res.status(400).send('Invalid signature');
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCreated(subscription);
          break;
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

export default router;
