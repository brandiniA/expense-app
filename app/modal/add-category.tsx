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
