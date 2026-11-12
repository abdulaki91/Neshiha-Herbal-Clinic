import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../i18n/i18n.dart';
import '../../i18n/language_picker.dart';
import '../../core/api_client.dart';
import '../../state/auth_controller.dart';
import '../../state/theme_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/backdrop.dart';
import '../../widgets/brand.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  bool _expired = false;

  @override
  void initState() {
    super.initState();
    _expired = context.read<AuthController>().consumeExpiredFlag();
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthController>();
    try {
      await auth.login(_email.text, _password.text);
      Toast.success(tr('login.toast.welcome', {'firstName': auth.user?.firstName ?? ''}));
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final brightness = Theme.of(context).brightness;
    return BackdropScaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight - 32),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Align(
                        alignment: Alignment.centerRight,
                        child: CircleIconButton(
                          icon: brightness == Brightness.dark
                              ? Icons.light_mode_rounded
                              : Icons.dark_mode_rounded,
                          tooltip: tr('mobile.login.toggleTheme'),
                          onPressed: () =>
                              context.read<ThemeController>().toggle(brightness),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const _LoginHero(),
                      const SizedBox(height: 22),
                      GlassCard(
                        radius: 30,
                        padding: const EdgeInsets.fromLTRB(22, 26, 22, 22),
                        child: Form(
                          key: _form,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(tr('mobile.login.welcome'),
                                  style: context.text.headlineSmall),
                              const SizedBox(height: 4),
                              Text(tr('mobile.login.subtitle'),
                                  style: context.text.bodyMedium
                                      ?.copyWith(color: p.inkMuted)),
                              const SizedBox(height: 22),
                              if (_expired) ...[
                                _Notice(
                                  icon: Icons.lock_clock_rounded,
                                  text:
                                      tr('mobile.login.sessionExpired'),
                                  color: p.warning,
                                ),
                                const SizedBox(height: 14),
                              ],
                              if (_error != null) ...[
                                _Notice(
                                  icon: Icons.error_outline_rounded,
                                  text: _error!,
                                  color: p.danger,
                                ),
                                const SizedBox(height: 14),
                              ],
                              TextFormField(
                                controller: _email,
                                keyboardType: TextInputType.emailAddress,
                                autofillHints: const [AutofillHints.email],
                                textInputAction: TextInputAction.next,
                                decoration: InputDecoration(
                                  labelText: tr('login.label.email'),
                                  prefixIcon: Icon(Icons.mail_outline_rounded),
                                ),
                                validator: (v) {
                                  final s = v?.trim() ?? '';
                                  if (s.isEmpty) return tr('login.validation.emailRequired');
                                  if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                                      .hasMatch(s)) {
                                    return tr('staffForm.emailInvalid');
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 14),
                              TextFormField(
                                controller: _password,
                                obscureText: _obscure,
                                autofillHints: const [AutofillHints.password],
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _submit(),
                                decoration: InputDecoration(
                                  labelText: tr('login.label.password'),
                                  prefixIcon:
                                      const Icon(Icons.lock_outline_rounded),
                                  suffixIcon: IconButton(
                                    icon: Icon(_obscure
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined),
                                    onPressed: () =>
                                        setState(() => _obscure = !_obscure),
                                  ),
                                ),
                                validator: (v) => (v ?? '').isEmpty
                                    ? tr('login.validation.passwordRequired')
                                    : null,
                              ),
                              const SizedBox(height: 24),
                              GradientButton(
                                label: tr('login.button.submit'),
                                icon: Icons.arrow_forward_rounded,
                                loading: _loading,
                                onPressed: _submit,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        tr('mobile.login.accountsNote'),
                        textAlign: TextAlign.center,
                        style: context.text.bodySmall,
                      ),
                      const SizedBox(height: 16),
                      const LanguagePicker(compact: true),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LoginHero extends StatelessWidget {
  const _LoginHero();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: Container(
        // A minimum, not a fixed height: grows with large accessibility fonts.
        constraints: const BoxConstraints(minHeight: 200),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: p.heroGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(-1, 1),
                    radius: 1.2,
                    colors: [p.heroBlob, p.heroBlob.withValues(alpha: 0)],
                  ),
                ),
              ),
            ),
            const Positioned(right: -8, bottom: -10, child: Sprigs(size: 150)),
            Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      BrandMark(size: 46),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          tr('login.brandName'),
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 36),
                  Text(
                    tr('mobile.login.tagline'),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      height: 1.2,
                      fontWeight: FontWeight.w400,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    tr('mobile.login.taglineSub'),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.icon, required this.text, required this.color});
  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: TextStyle(color: color, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
