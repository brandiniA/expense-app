# Plan 6: Configuración - Gestión de Etiquetas

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar la pantalla de configuración con gestión completa de etiquetas (ver, agregar, editar, eliminar) y pantalla de info de la app.

**Architecture:** Pantalla Settings con FlatList de categorías. Las predefinidas (is_default=true) no se pueden eliminar. Al eliminar una categoría custom con gastos asociados, se muestra confirmación. Modal para agregar/editar categoría con nombre, color (paleta predefinida) y emoji.

**Tech Stack:** React Native, expo-router (modal), TypeScript

**Prerequisite:** Plan 1 completado (repositorio de categorías).

---

## Task 1: Definir paleta de colores disponibles

**Create file:** `constants/color-palette.ts`

```typescript
export const COLOR_PALETTE = [
  '#4A90D9',
  '#3498DB',
  '#1ABC9C',
  '#2ECC71',
  '#27AE60',
  '#F39C12',
  '#E67E22',
  '#E74C3C',
  '#C0392B',
  '#9B59B6',
  '#8E44AD',
  '#E91E63',
  '#607D8B',
  '#795548',
  '#FF6F61',
  '#34495E',
];

export const EMOJI_OPTIONS = [
  '🏠', '🎬', '📱', '🚗', '🍽️', '💊', '📚', '🚌', '👕',
  '💰', '🎁', '🏋️', '✈️', '🐾', '🎵', '🛒', '💇', '🔧',
  '📦', '🎮', '☕', '🍕', '🏥', '🎂', '📝', '🔌', '🏦', '💡',
];
```

**Verify:** No errors.

**Commit:** `feat: add color palette and emoji options constants`

---

## Task 2: Implementar modal Agregar/Editar Categoría

**Create file:** `app/modal/add-category.tsx`

```typescript
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  addCategory,
  updateCategory,
  getCategoryById,
} from '../../db/repository';
import { COLOR_PALETTE, EMOJI_OPTIONS } from '../../constants/color-palette';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

export default function AddCategoryModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const isEditing = Boolean(params.categoryId);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && params.categoryId) {
      loadCategory(Number(params.categoryId));
    }
  }, [isEditing, params.categoryId]);

  async function loadCategory(id: number) {
    const cat = await getCategoryById(id);
    if (!cat) return;
    setName(cat.name);
    setSelectedColor(cat.color);
    setSelectedEmoji(cat.icon || EMOJI_OPTIONS[0]);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la categoría');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && params.categoryId) {
        await updateCategory(
          Number(params.categoryId),
          name.trim(),
          selectedColor,
          selectedEmoji
        );
      } else {
        await addCategory(name.trim(), selectedColor, selectedEmoji);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la categoría');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.handleBar} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.title}>
          {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        </Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.preview}>
          <View
            style={[
              styles.previewBadge,
              { backgroundColor: selectedColor + '20' },
            ]}
          >
            <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
            <Text style={[styles.previewName, { color: selectedColor }]}>
              {name || 'Categoría'}
            </Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Mascotas, Gym, Viajes..."
            placeholderTextColor={Colors.textMuted}
            maxLength={30}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {COLOR_PALETTE.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Emoji</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                style={[
                  styles.emojiCell,
                  selectedEmoji === emoji && styles.emojiSelected,
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving
              ? 'Guardando...'
              : isEditing
              ? 'Actualizar'
              : 'Crear categoría'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  preview: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  previewEmoji: {
    fontSize: FontSize.xl,
  },
  previewName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: Colors.text,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emojiCell: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  emojiSelected: {
    backgroundColor: Colors.primaryLight,
  },
  emojiText: {
    fontSize: 24,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
```

**Verify:** No TypeScript errors.

**Commit:** `feat: implement add/edit category modal`

---

## Task 3: Implementar pantalla Settings

**Edit file:** `app/(tabs)/settings.tsx`

```typescript
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '../../hooks/use-categories';
import { deleteCategory } from '../../db/repository';
import { CategoryBadge } from '../../components/category-badge';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { Category } from '../../types';

export default function SettingsScreen() {
  const { categories, refresh } = useCategories();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function handleEditCategory(cat: Category) {
    router.push({
      pathname: '/modal/add-category',
      params: { categoryId: cat.id },
    });
  }

  function handleDeleteCategory(cat: Category) {
    if (cat.is_default) {
      Alert.alert('No disponible', 'Las categorías predefinidas no se pueden eliminar');
      return;
    }

    Alert.alert(
      'Eliminar categoría',
      `¿Estás segura de eliminar "${cat.name}"? Los gastos asociados quedarán sin categoría.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id);
            refresh();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Etiquetas</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/modal/add-category')}
        >
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.categoryRow}>
            <CategoryBadge
              name={item.name}
              color={item.color}
              icon={item.icon}
              size="md"
            />
            <View style={styles.actions}>
              {item.is_default && (
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={Colors.textMuted}
                />
              )}
              <Pressable onPress={() => handleEditCategory(item)}>
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
              </Pressable>
              {!item.is_default && (
                <Pressable onPress={() => handleDeleteCategory(item)}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.danger}
                  />
                </Pressable>
              )}
            </View>
          </View>
        )}
      />

      <View style={styles.appInfo}>
        <Text style={styles.appName}>Gastos App</Text>
        <Text style={styles.appVersion}>Versión 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    padding: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  appInfo: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  appName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  appVersion: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
```

**Verify:**
```bash
npx tsc --noEmit
npx expo start --android
```
Probar: Settings → ver categorías → agregar nueva → editar existente → eliminar custom.

**Commit:** `feat: implement Settings screen with category management`

---

## Resultado Esperado

Al completar este plan tendrás:
- Pantalla Settings con lista de todas las categorías
- Indicador de candado en categorías predefinidas
- Modal para agregar categoría nueva (nombre, color de paleta, emoji)
- Editar categorías existentes
- Eliminar categorías custom (con confirmación)
- Sección de info de la app
