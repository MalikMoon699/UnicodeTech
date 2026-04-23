import React, { useEffect, useRef, useState } from "react";
import {
  Input,
  ProfileImage,
  Header,
} from "../components/CustomComponents";
import "../assets/style/Settings.css";
import { Camera, Mail, Palette, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { IMAGES } from "../utils/constants";
import Loader from "../components/Loader";
import { toast } from "sonner";
import { UpdateProfileHelper } from "../services/setting.services.js";
import { handleUploadImage } from "../utils/helper.js";

const Setting = () => {
  const { theme, toggleTheme, isEnterSubmit, toggleSubmit } = useTheme();
  const { currentUser } = useAuth();
  const [loadingType, setLoadingType] = useState("");
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (currentUser) {
      setName(currentUser?.fullName);
    }
  }, [currentUser]);

  const handleProfileUpdate = async () => {
    try {
      setLoadingType("UpdateProfile");

      let profileImgUrl = currentUser?.profileImage || "";

      if (avatarFile) {
        profileImgUrl = await handleUploadImage(avatarFile);
      }

      const isNameChanged = name !== currentUser?.fullName;
      const isImageChanged = profileImgUrl !== currentUser?.profileImage;

      if (!isNameChanged && !isImageChanged) {
        toast.info("No changes detected");
        return;
      }

      await UpdateProfileHelper({
        currentUser,
        updatedName: name,
        email: currentUser?.email,
        updatedProfileImage: profileImgUrl,
      });

      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setLoadingType("");
    }
  };

  return (
    <div className="page-container">
      <Header title="Settings" desc="Manage your account settings" />
      <section className="settings-section">
        <div className="settings-section-header">
          <Camera size={20} />
          <div>
            <h2 className="settings-section-title">Profile</h2>
            <p className="settings-section-description">
              Update your personal information
            </p>
          </div>
        </div>

        <div className="settings-avatar-row">
          <ProfileImage
            Image={
              avatarPreview || currentUser?.profilImg || IMAGES.PlaceHolder
            }
            className="settings-avatar"
          />
          <div className="settings-avatar-actions">
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }}
            />

            <button
              onClick={() => fileInputRef.current.click()}
              className="settings-outline-button"
            >
              <Camera size={16} /> Change Avatar
            </button>
            <p className="settings-hint">JPG, PNG or GIF. Max size 2MB.</p>
          </div>
        </div>

        <div className="settings-divider" />
        <Input
          label="Full Name"
          value={name}
          setValue={setName}
          placeholder="John doe"
          type="inputIcon"
          Icon={User}
        />

        <Input
          label="Email"
          value={currentUser?.email || "N/A"}
          readOnly={true}
          onClick={() => toast.error("Email not change able.")}
          placeholder="john@example.com"
          type="inputIcon"
          Icon={Mail}
          InputType="email"
        />
        <button
          disabled={loadingType !== ""}
          onClick={handleProfileUpdate}
          className="settings-primary-button"
        >
          {loadingType === "UpdateProfile" ? (
            <Loader color="#fff" size="15" stroke="2" />
          ) : (
            "Save Changes"
          )}
        </button>
      </section>

      <section className="settings-section">
        <div className="settings-section-header">
          <Palette size={20} />
          <div>
            <h2 className="settings-section-title">Appearance</h2>
            <p className="settings-section-description">
              Customize how HealthPilot looks
            </p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div>
            <span className="settings-toggle-title">Dark Mode</span>
            <p className="settings-toggle-description">
              Switch between light and dark themes
            </p>
          </div>
          <input type="checkbox" value={theme} onChange={toggleTheme} />
        </div>
        <div className="settings-toggle-row" style={{ marginTop: "8px" }}>
          <div>
            <span className="settings-toggle-title">Send on Enter</span>
            <p className="settings-toggle-description">
              Press Enter to send your message instantly. Turn off to use Enter
              for a new line and use send button to send.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isEnterSubmit}
            onChange={toggleSubmit}
          />
        </div>
      </section>
    </div>
  );
};

export default Setting;
