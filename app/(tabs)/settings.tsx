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
      pathname: '/modal/add-category' as any,
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
          onPress={() => router.push('/modal/add-category' as any)}
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
