import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useContactDetail,
  useUpdateContactMutation,
} from "@/lib/queries/contacts";
import { useThemeColors } from "@/theme";

const categories = ["vendor", "law_enforcement", "emergency_services", "media", "other"];
const contactTypes = ["individual", "organization"];

export default function EditContactScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const contactId = params.id ?? "";
  const detailQuery = useContactDetail(contactId);
  const updateMutation = useUpdateContactMutation(contactId);
  const contact = detailQuery.data;
  const [bootstrapped, setBootstrapped] = useState(false);
  const [category, setCategory] = useState("vendor");
  const [contactType, setContactType] = useState("individual");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!contact || bootstrapped) {
      return;
    }

    setCategory(contact.category);
    setContactType(contact.contactType);
    setFirstName(contact.firstName ?? "");
    setLastName(contact.lastName ?? "");
    setOrganizationName(contact.organizationName ?? "");
    setTitle(contact.title ?? "");
    setPhone(contact.phone ?? "");
    setSecondaryPhone(contact.secondaryPhone ?? "");
    setEmail(contact.email ?? "");
    setAddress(contact.address ?? "");
    setIdType(contact.idType ?? "");
    setIdNumber(contact.idNumber ?? "");
    setNotes(contact.notes ?? "");
    setBootstrapped(true);
  }, [bootstrapped, contact]);

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        address: address || undefined,
        category,
        contactType,
        email: email || undefined,
        firstName: firstName || undefined,
        idNumber: idNumber || undefined,
        idType: idType || undefined,
        lastName: lastName || undefined,
        notes: notes || undefined,
        organizationName: organizationName || undefined,
        phone: phone || undefined,
        secondaryPhone: secondaryPhone || undefined,
        title: title || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not update the contact."
      );
    }
  };

  if (!contact) {
    return (
      <ScreenContainer subtitle="Loading contact" title="Edit Contact">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The contact is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Contact</Text>
          <Text style={styles.heroCopy}>
            Update the contact directory record from mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle={contact.category}
      title="Contact Update"
    >
      <SectionCard title="Type">
        <View style={styles.stack}>
          <FilterChips onSelect={setCategory} options={categories} selected={category} />
          <FilterChips onSelect={setContactType} options={contactTypes} selected={contactType} />
        </View>
      </SectionCard>

      <SectionCard title="Identity">
        <View style={styles.stack}>
          <TextField label="First name" onChangeText={setFirstName} value={firstName} />
          <TextField label="Last name" onChangeText={setLastName} value={lastName} />
          <TextField label="Organization" onChangeText={setOrganizationName} value={organizationName} />
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField label="ID type" onChangeText={setIdType} value={idType} />
          <TextField label="ID number" onChangeText={setIdNumber} value={idNumber} />
        </View>
      </SectionCard>

      <SectionCard title="Contact">
        <View style={styles.stack}>
          <TextField label="Phone" onChangeText={setPhone} value={phone} />
          <TextField label="Secondary phone" onChangeText={setSecondaryPhone} value={secondaryPhone} />
          <TextField label="Email" onChangeText={setEmail} value={email} />
          <TextField label="Address" onChangeText={setAddress} value={address} />
          <TextField label="Notes" multiline onChangeText={setNotes} value={notes} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Save Contact"
              loading={updateMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
            />
          </View>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    hero: { gap: 8 },
    heroCopy: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    heroTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
    stack: { gap: 16 },
  });
}
