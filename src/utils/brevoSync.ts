import { supabase } from '../lib/supabase';

/**
 * Sincronizza un singolo utente con Brevo
 */
export async function syncUserToBrevo(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return { success: false, error: 'Email not found' };
    }

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-to-brevo`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        email: profile.email,
        action: 'update',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Brevo sync error:', result);
      return { success: false, error: result.error || 'Sync failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing to Brevo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Sincronizza tutti gli utenti con Brevo (batch)
 */
export async function syncAllUsersToBrevo(
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, email')
      .not('email', 'is', null);

    if (error || !users) {
      throw new Error('Failed to fetch users');
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sync users one by one with delay to avoid rate limiting
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      if (onProgress) {
        onProgress(i + 1, users.length);
      }

      const result = await syncUserToBrevo(user.id);

      if (result.success) {
        success++;
      } else {
        failed++;
        errors.push(`${user.email}: ${result.error}`);
      }

      // Wait 100ms between requests to avoid rate limiting
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success, failed, errors };
  } catch (error) {
    console.error('Error in batch sync:', error);
    return {
      success: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Sincronizza un utente con Brevo dopo un evento specifico
 */
export async function syncUserAfterEvent(userId: string, event: 'profile_update' | 'appointment_created' | 'subscription_change') {
  console.log(`Syncing user ${userId} to Brevo after event: ${event}`);

  // Call sync in background, don't wait for result
  syncUserToBrevo(userId).then(result => {
    if (result.success) {
      console.log(`User ${userId} synced to Brevo successfully`);
    } else {
      console.error(`Failed to sync user ${userId} to Brevo:`, result.error);
    }
  });
}
