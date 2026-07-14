import { Router } from 'express';
import { verifyAuth, AuthRequest } from '../middleware/subscription';
import {
  createCheckoutSession,
  createOrGetStripeCustomer,
  isValidPlanId,
} from '../services/stripe';
import { initializeUserSubscription, getTrialStatus } from '../services/subscription';

const router = Router();

// Inicializar suscripción (trial) para nuevo usuario
router.post('/initialize-subscription', verifyAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.uid) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const subscription = await initializeUserSubscription(req.uid);
    res.json(subscription);
  } catch (error) {
    console.error('Error initializing subscription:', error);
    res.status(500).json({ error: 'Failed to initialize subscription' });
  }
});

// Obtener estado del trial
router.get('/trial-status', verifyAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.uid) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const status = await getTrialStatus(req.uid);
    res.json(status);
  } catch (error) {
    console.error('Error getting trial status:', error);
    res.status(500).json({ error: 'Failed to get trial status' });
  }
});

// Crear sesión de checkout para upgrade
router.post('/create-checkout-session', verifyAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.uid || !req.email) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { successUrl, cancelUrl, planId } = req.body;

    if (!successUrl || !cancelUrl) {
      res.status(400).json({ error: 'Missing success/cancel URLs' });
      return;
    }

    if (!isValidPlanId(planId)) {
      res.status(400).json({ error: 'planId inválido o faltante' });
      return;
    }

    const session = await createCheckoutSession(
      req.uid,
      req.email,
      successUrl,
      cancelUrl,
      planId
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;
